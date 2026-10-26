from scrape import status_of


def test_checked_in():
    assert status_of({"checkedIn": True, "deletedAt": None}, class_ended=True) == "checked_in"


def test_no_show_when_class_ended():
    assert status_of({"checkedIn": False, "deletedAt": None}, class_ended=True) == "no_show"


def test_booked_when_class_not_ended():
    assert status_of({"checkedIn": False, "deletedAt": None}, class_ended=False) == "booked"


def test_cancelled_by_deleted_at():
    assert status_of({"checkedIn": False, "deletedAt": "2026-07-14T10:00:00Z"}, class_ended=True) == "cancelled"


def test_late_cancel_is_cancelled():
    b = {"checkedIn": False, "deletedAt": "2026-07-14T10:00:00Z", "isLateCancelled": True}
    assert status_of(b, class_ended=True) == "cancelled"
