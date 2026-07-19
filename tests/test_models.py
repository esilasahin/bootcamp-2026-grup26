from sqlalchemy import inspect, select

from app.db.session import SessionLocal, engine
from app.models.analysis_result import AnalysisResult
from app.models.document import Document
from app.models.user import User


def test_required_tables_exist():
    tables = set(inspect(engine).get_table_names())
    assert {"users", "documents", "analysis_results"}.issubset(tables)


def test_user_delete_cascades_to_documents_and_results():
    with SessionLocal() as db:
        user = User(
            full_name="Test User",
            email="cascade@example.com",
            hashed_password="not-used-in-this-test",
        )
        document = Document(
            user=user,
            original_filename="lesson.pdf",
            file_type="pdf",
        )
        result = AnalysisResult(
            document=document,
            analysis_type="summary",
            result_text="Özet",
        )
        db.add(user)
        db.commit()

        user_id = user.id
        document_id = document.id
        result_id = result.id

        db.delete(user)
        db.commit()

        assert db.get(User, user_id) is None
        assert db.get(Document, document_id) is None
        assert db.get(AnalysisResult, result_id) is None
        assert db.scalar(select(Document).where(Document.user_id == user_id)) is None
