from __future__ import annotations

from typing import Optional

from pydantic import BaseModel


class CustomerSummary(BaseModel):
    member_id: int
    name: str
    attended: int
    no_shows: int
    cancelled: int
    late_cancels: int
    signups: int
    first_visit: Optional[str]
    last_visit: Optional[str]


class Visit(BaseModel):
    booking_id: int
    class_id: int
    local_date: str
    class_name: str
    location: Optional[str]
    weekday: int
    is_mine: int


class CustomerDetail(CustomerSummary):
    visits: list[Visit]


class Booking(BaseModel):
    member_id: int
    customer_name: str
    attended: int
    last_visit: Optional[str]
    is_first: bool


class ClassBookings(BaseModel):
    class_id: int
    class_name: str
    local_date: str
    local_time: str
    location: Optional[str]
    weekday: int
    capacity: Optional[int]
    bookings: list[Booking]


class TierBreakdown(BaseModel):
    tier: str
    count: int
    min_attended: int


class LocationSummary(BaseModel):
    location: str
    total_headcount: int
    classes: int
    avg_per_class: Optional[float]
