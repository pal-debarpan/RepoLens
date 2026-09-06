import pytest
from app.services.entry_points import is_entry_point


def test_is_entry_point_by_filename():
    assert is_entry_point("main.py") is True
    assert is_entry_point("server.js") is True
    assert is_entry_point("app.ts") is True
    assert is_entry_point("index.js") is True
    assert is_entry_point("Main.java") is True
    assert is_entry_point("main.go") is True
    assert is_entry_point("utils/helpers.py") is False


def test_is_entry_point_by_directory():
    assert is_entry_point("api/v1/users.py") is True
    assert is_entry_point("src/routes/auth.js") is True
    assert is_entry_point("controllers/paymentController.ts") is True
    assert is_entry_point("models/user.py") is False


def test_is_entry_point_by_content():
    fastapi_code = "@router.get('/items')\ndef get_items(): pass"
    assert is_entry_point("items.py", code_content=fastapi_code) is True

    express_code = "app.post('/charge', (req, res) => {})"
    assert is_entry_point("charge.js", code_content=express_code) is True

    main_block = "if __name__ == '__main__':\n    run()"
    assert is_entry_point("script.py", code_content=main_block) is True

    plain_code = "def add(a, b):\n    return a + b"
    assert is_entry_point("math.py", code_content=plain_code) is False
