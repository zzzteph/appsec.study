from typing import List, Optional

import strawberry
from strawberry.fastapi import GraphQLRouter

from . import db


@strawberry.type
class User:
    id: str
    name: str
    email: str
    role: str
    # VULN[graphql-excessive-data] the password field is exposed in the schema.
    password: str


def _to_user(u) -> "User":
    return User(id=u["id"], name=u["name"], email=u["email"], role=u["role"], password=u["password"])


@strawberry.type
class Query:
    @strawberry.field
    def users(self) -> List[User]:
        # VULN[graphql-bola] unauthenticated dump of every user.
        return [_to_user(u) for u in db.users]

    @strawberry.field
    def user(self, id: str) -> Optional[User]:
        # VULN[graphql-idor] any user by id, no auth / ownership check.
        u = db.users_by_id.get(id)
        return _to_user(u) if u else None

    @strawberry.field
    def secret(self) -> str:
        # VULN[graphql-secret] a field that returns server secrets.
        return "stripe=sk_live_51NomNomDoNotShare; jwt_secret=nomnom-super-secret-key"


# Introspection + the GraphiQL IDE are enabled by default -> VULN[graphql-introspection].
schema = strawberry.Schema(Query)
graphql_router = GraphQLRouter(schema)
