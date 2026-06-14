from typing import Optional
from pydantic import BaseModel


class RegisterIn(BaseModel):
    name: str
    email: str
    password: str
    referral_code: Optional[str] = None


class LoginIn(BaseModel):
    email: str
    password: str


class PasswordResetIn(BaseModel):
    email: str
    new_password: Optional[str] = None
    token: Optional[str] = None


class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    role: str = "customer"


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    # VULN[mass-assignment]: privileged fields accepted straight from the client.
    role: Optional[str] = None
    wallet: Optional[float] = None


class AddressIn(BaseModel):
    line1: str
    city: str
    postcode: str


class PaymentMethodIn(BaseModel):
    card_number: str
    exp: str


class RestaurantIn(BaseModel):
    name: str
    cuisine: str
    address: str
    hours: Optional[str] = "09:00-23:00"


class MenuItemIn(BaseModel):
    name: str
    price: float
    category: str = "main"


class CategoryIn(BaseModel):
    name: str


class ModifierIn(BaseModel):
    name: str
    price: float = 0.0


class BasketItemIn(BaseModel):
    item_id: int
    qty: int = 1


class CheckoutIn(BaseModel):
    address: str
    # VULN[price-tamper]: if supplied, the client-provided total is trusted.
    total: Optional[float] = None
    promo: Optional[str] = None


class OrderIn(BaseModel):
    restaurant_id: int
    items: list[BasketItemIn]
    address: str
    total: Optional[float] = None


class PaymentIn(BaseModel):
    order_id: int
    # VULN[price-tamper]: amount is taken from the request, not the order.
    amount: float
    method: str = "card"


class ReviewIn(BaseModel):
    restaurant_id: int
    rating: int
    text: str


class PromoIn(BaseModel):
    code: str
    percent: int


class DriverIn(BaseModel):
    name: str
    phone: str
