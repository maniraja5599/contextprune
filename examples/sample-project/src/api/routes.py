from typing import List, Optional
from dataclasses import dataclass

@dataclass
class InvoiceItem:
    description: str
    amount: float
    tax_rate: float = 0.05

class InvoiceRouter:
    """Manages generation and processing of user billing invoices."""

    def __init__(self, api_key: str):
        self.api_key = api_key

    def calculate_tax(self, item: InvoiceItem) -> float:
        """Calculates item tax based on standard state tax rates."""
        base_tax = item.amount * item.tax_rate
        surcharge = 1.50 if item.amount > 100 else 0.0
        return base_tax + surcharge

    async def create_invoice(self, user_id: str, items: List[InvoiceItem]) -> dict:
        """Asynchronously creates an invoice and issues payment charge."""
        total = sum(i.amount + self.calculate_tax(i) for i in items)
        # 30 lines of PDF invoice generation, Stripe billing dispatch, email notifications
        return {"invoice_id": f"inv_{user_id}", "total": total, "status": "draft"}
