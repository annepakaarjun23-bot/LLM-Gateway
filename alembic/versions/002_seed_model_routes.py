from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = '002'
down_revision: Union[str, None] = '001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.bulk_insert(
        sa.table(
            'model_routes',
            sa.column('internal_name', sa.String),
            sa.column('provider', sa.String),
            sa.column('provider_model_id', sa.String),
            sa.column('endpoint_url', sa.String),
            sa.column('priority', sa.Integer),
        ),
        [
            {
                'internal_name': 'kimi-k2-6',
                'provider': 'openrouter',
                'provider_model_id': 'moonshotai/kimi-k2-6',
                'endpoint_url': 'https://openrouter.ai/api/v1/chat/completions',
                'priority': 1,
            },

            {
                'internal_name': 'claude-3.5-sonnet',
                'provider': 'openrouter',
                'provider_model_id': 'anthropic/claude-3.5-sonnet',
                'endpoint_url': 'https://openrouter.ai/api/v1/chat/completions',
                'priority': 1,
            },

            {
                'internal_name': 'gpt-4o-mini',
                'provider': 'openrouter',
                'provider_model_id': 'openai/gpt-4o-mini',
                'endpoint_url': 'https://openrouter.ai/api/v1/chat/completions',
                'priority': 1,
            },

            {
                'internal_name': 'gpt-4o',
                'provider': 'openrouter',
                'provider_model_id': 'openai/gpt-4o',
                'endpoint_url': 'https://openrouter.ai/api/v1/chat/completions',
                'priority': 1,
            },


  
            {
                'internal_name': 'mistral-large-3',
                'provider': 'nvidia',
                'provider_model_id': 'mistralai/mistral-large-3-instruct',
                'endpoint_url': 'https://integrate.api.nvidia.com/v1/chat/completions',
                'priority': 1,
            },

            {
                'internal_name': 'llama-3.3-70b',
                'provider': 'groq',
                'provider_model_id': 'llama-3.3-70b-versatile',
                'endpoint_url': 'https://api.groq.com/openai/v1/chat/completions',
                'priority': 1,
            },
            {
                'internal_name': 'llama-3.3-70b',
                'provider': 'openrouter',
                'provider_model_id': 'meta-llama/llama-3.3-70b-instruct',
                'endpoint_url': 'https://openrouter.ai/api/v1/chat/completions',
                'priority': 2,
            },

            {
                'internal_name': 'mixtral-8x7b',
                'provider': 'groq',
                'provider_model_id': 'mixtral-8x7b-32768',
                'endpoint_url': 'https://api.groq.com/openai/v1/chat/completions',
                'priority': 1,
            },
            {
                'internal_name': 'mixtral-8x7b',
                'provider': 'openrouter',
                'provider_model_id': 'mistralai/mixtral-8x7b-instruct',
                'endpoint_url': 'https://openrouter.ai/api/v1/chat/completions',
                'priority': 2,
            },
        ]
    )


def downgrade() -> None:
    op.execute(
        "DELETE FROM model_routes WHERE internal_name IN ("
        "'kimi-k2-6', 'claude-3.5-sonnet', 'gpt-4o-mini', 'gpt-4o', "
        "'mistral-large-3', 'llama-3.3-70b', 'mixtral-8x7b'"
        ")"
    )