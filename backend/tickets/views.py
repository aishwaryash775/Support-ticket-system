from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Q, Count, Avg
from django.db.models.functions import TruncDate
from .models import Ticket
from .serializers import TicketSerializer
import os
import openai


class TicketListCreateView(generics.ListCreateAPIView):
    serializer_class = TicketSerializer

    def get_queryset(self):
        queryset = Ticket.objects.all()

        category = self.request.query_params.get("category")
        priority = self.request.query_params.get("priority")
        status_param = self.request.query_params.get("status")
        search = self.request.query_params.get("search")

        if category:
            queryset = queryset.filter(category=category)

        if priority:
            queryset = queryset.filter(priority=priority)

        if status_param:
            queryset = queryset.filter(status=status_param)

        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(description__icontains=search)
            )

        return queryset


class TicketUpdateView(generics.RetrieveUpdateAPIView):
    queryset = Ticket.objects.all()
    serializer_class = TicketSerializer


class TicketStatsView(APIView):

    def get(self, request):
        total = Ticket.objects.count()
        open_count = Ticket.objects.filter(status='open').count()

        per_day = (
            Ticket.objects
            .annotate(date=TruncDate('created_at'))
            .values('date')
            .annotate(count=Count('id'))
            .aggregate(avg=Avg('count'))
        )

        priority_data = (
            Ticket.objects
            .values('priority')
            .annotate(count=Count('id'))
        )

        category_data = (
            Ticket.objects
            .values('category')
            .annotate(count=Count('id'))
        )

        return Response({
            "total_tickets": total,
            "open_tickets": open_count,
            "avg_tickets_per_day": per_day["avg"] or 0,
            "priority_breakdown": {
                item["priority"]: item["count"]
                for item in priority_data
            },
            "category_breakdown": {
                item["category"]: item["count"]
                for item in category_data
            }
        })




class TicketClassifyView(APIView):

    def post(self, request):
        description = request.data.get("description")

        if not description:
            return Response(
                {"error": "Description is required"},
                status=400
            )

        try:
            openai.api_key = os.getenv("OPENAI_API_KEY")

            prompt = f"""
            Classify the following support ticket.

            Categories: billing, technical, account, general
            Priorities: low, medium, high, critical

            Return ONLY valid JSON like:
            {{
                "category": "...",
                "priority": "..."
            }}

            Ticket:
            {description}
            """

            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}]
            )

            content = response.choices[0].message["content"]

            # Try parsing safely
            import json
            parsed = json.loads(content)

            return Response({
                "suggested_category": parsed.get("category"),
                "suggested_priority": parsed.get("priority")
            })

        except Exception:
            # Graceful failure
            return Response({
                "suggested_category": None,
                "suggested_priority": None
            })
