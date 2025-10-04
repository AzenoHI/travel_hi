from app.repositories.report import ReportRepository


class ReportService:
    def __init__(self, repo: ReportRepository):
        self.repo = repo

    def create(self, **kwargs):
        return self.repo.create(**kwargs)

    def get(self, id_: int):
        return self.repo.get(id_)

    def list(self, skip: int, limit: int):
        return self.repo.list(skip=skip, limit=limit)