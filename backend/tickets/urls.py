from django.urls import path
from .views import TicketListCreateView, TicketUpdateView, TicketStatsView

from .views import (
    TicketListCreateView,
    TicketUpdateView,
    TicketStatsView,
    TicketClassifyView
)
urlpatterns = [
    path('tickets/stats/', TicketStatsView.as_view()),  # 👈 IMPORTANT: Put this FIRST
      path('tickets/classify/', TicketClassifyView.as_view()),
    path('tickets/', TicketListCreateView.as_view()),
    path('tickets/<int:pk>/', TicketUpdateView.as_view()),
]
