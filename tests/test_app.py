import copy

import pytest
from fastapi.testclient import TestClient

from src.app import app, activities


@pytest.fixture(autouse=True)
def reset_activities():
    """Reset the in-memory activities to the original state for each test."""
    original = copy.deepcopy(activities)
    yield
    activities.clear()
    activities.update(original)


def test_get_activities():
    client = TestClient(app)
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    assert "Chess Club" in data


def test_signup_success():
    client = TestClient(app)
    email = "teststudent@mergington.edu"
    resp = client.post(f"/activities/{'Chess Club'}/signup?email={email}")
    assert resp.status_code == 200
    assert email in activities["Chess Club"]["participants"]


def test_signup_already_signed_up():
    client = TestClient(app)
    email = "michael@mergington.edu"  # already in Chess Club in fixtures
    resp = client.post(f"/activities/{'Chess Club'}/signup?email={email}")
    assert resp.status_code == 400


def test_unregister_success():
    client = TestClient(app)
    email = "michael@mergington.edu"
    # Ensure present
    assert email in activities["Chess Club"]["participants"]
    resp = client.post(f"/activities/{'Chess Club'}/unregister?email={email}")
    assert resp.status_code == 200
    assert email not in activities["Chess Club"]["participants"]


def test_unregister_not_signed_up():
    client = TestClient(app)
    email = "not.registered@mergington.edu"
    resp = client.post(f"/activities/{'Chess Club'}/unregister?email={email}")
    assert resp.status_code == 400
