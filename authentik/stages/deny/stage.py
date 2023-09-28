"""Deny stage logic"""
from django.http import HttpRequest, HttpResponse

from authentik.flows.stage import StageView
from authentik.policies.exceptions import PolicyException
from authentik.policies.expression.evaluator import PolicyEvaluator


class DenyStageView(StageView):
    """Cancels the current flow"""

    def dispatch(self, request: HttpRequest) -> HttpResponse:
        """Cancels the current flow"""
        evaluator = PolicyEvaluator("deny")
        template = f'ak_message("{message}");return False'
        try:
            evaluator.evaluate(template)
        except PolicyException as exc:
            self.logger.warning(f'Failed to evaluate "{template}"', exc=exc)

        self.logger.warning(message)
        return self.executor.stage_invalid()
