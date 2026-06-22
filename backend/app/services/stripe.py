import asyncio
import uuid
from typing import Any, Dict

import stripe

from app.core.config import get_settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class StripeService:
    """Wrapper service for Stripe API interactions with mock fallback."""

    def __init__(self) -> None:
        settings = get_settings()
        self.api_key = settings.stripe_secret_key
        if self.api_key:
            stripe.api_key = self.api_key
        else:
            logger.warning("Stripe API key is not configured. Running in MOCK Mode.")

    async def create_payment_intent(self, amount_cents: int, currency: str = "usd") -> Dict[str, Any]:
        """
        Create a PaymentIntent with manual capture method.
        This pre-authorizes the card without capturing funds immediately.
        """
        if not self.api_key:
            mock_id = f"pi_mock_{uuid.uuid4().hex[:12]}"
            logger.info("[MOCK Stripe] Created PaymentIntent %s for %d cents", mock_id, amount_cents)
            return {
                "id": mock_id,
                "client_secret": f"{mock_id}_secret_{uuid.uuid4().hex[:8]}",
                "amount": amount_cents,
                "status": "requires_payment_method"
            }
        
        try:
            loop = asyncio.get_running_loop()
            intent = await loop.run_in_executor(
                None,
                lambda: stripe.PaymentIntent.create(
                    amount=amount_cents,
                    currency=currency,
                    capture_method="manual",
                    metadata={"integration": "routewise"}
                )
            )
            return {
                "id": intent.id,
                "client_secret": intent.client_secret,
                "amount": intent.amount,
                "status": intent.status
            }
        except Exception:
            logger.exception("Stripe PaymentIntent creation failed")
            raise

    async def capture_payment_intent(self, payment_intent_id: str) -> Dict[str, Any]:
        """Capture a pre-authorized PaymentIntent."""
        if not self.api_key or payment_intent_id.startswith("pi_mock_"):
            logger.info("[MOCK Stripe] Captured PaymentIntent %s", payment_intent_id)
            return {
                "id": payment_intent_id,
                "status": "succeeded"
            }

        try:
            loop = asyncio.get_running_loop()
            intent = await loop.run_in_executor(
                None,
                lambda: stripe.PaymentIntent.capture(payment_intent_id)
            )
            return {
                "id": intent.id,
                "status": intent.status
            }
        except Exception:
            logger.exception("Stripe PaymentIntent capture failed for %s", payment_intent_id)
            raise

    async def cancel_payment_intent(self, payment_intent_id: str) -> Dict[str, Any]:
        """Cancel/void a pre-authorized PaymentIntent."""
        if not self.api_key or payment_intent_id.startswith("pi_mock_"):
            logger.info("[MOCK Stripe] Cancelled PaymentIntent %s", payment_intent_id)
            return {
                "id": payment_intent_id,
                "status": "canceled"
            }

        try:
            loop = asyncio.get_running_loop()
            intent = await loop.run_in_executor(
                None,
                lambda: stripe.PaymentIntent.cancel(payment_intent_id)
            )
            return {
                "id": intent.id,
                "status": intent.status
            }
        except Exception:
            logger.exception("Stripe PaymentIntent cancellation failed for %s", payment_intent_id)
            raise


stripe_service = StripeService()
