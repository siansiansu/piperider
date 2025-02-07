import inspect
from typing import Callable, List, Dict

from ruamel.yaml.comments import CommentedMap, CommentedSeq

from piperider_cli.assertion_engine.recommended_rules import RecommendedAssertion, RecommendedRules

recommended_rule_parameter_keys = ['table', 'column', 'profiling_result']

RECOMMENDED_ASSERTION_TAG = 'RECOMMENDED'


class AssertionRecommender:
    def __init__(self):
        self.assertions: Dict[CommentedMap] = {}
        self.recommended_rule_callbacks = []
        self.load_recommended_rules()
        self.generated_assertions: List[RecommendedAssertion] = []
        pass

    def prepare_assertion_template(self, profiling_result):
        for name, table in profiling_result.get('tables', {}).items():
            # Generate template of assertions
            table_assertions = CommentedSeq()
            columns = CommentedMap()

            # Generate assertions for columns
            for col in table.get('columns', {}).keys():
                column_name = str(col)
                column_assertions = CommentedSeq()
                columns[column_name] = CommentedMap({
                    'tests': column_assertions,
                })
                columns[column_name].yaml_set_comment_before_after_key('tests', indent=6,
                                                                       before='Test Cases for Column')
                columns.yaml_add_eol_comment('Column Name', column_name)

            # Generate assertions for table
            recommended_assertion = CommentedMap({
                name: CommentedMap({
                    'tests': table_assertions,
                    'columns': columns,
                })})
            recommended_assertion.yaml_set_start_comment(f'# Auto-generated by Piperider based on table "{name}"')
            recommended_assertion.yaml_add_eol_comment('Table Name', name)
            recommended_assertion[name].yaml_set_comment_before_after_key('tests', indent=2,
                                                                          before='Test Cases for Table')
            self.assertions[name] = recommended_assertion
        return self.assertions

    def run(self, profiling_result) -> List[RecommendedAssertion]:
        if not self.assertions:
            self.prepare_assertion_template(profiling_result)

        for table, ta in self.assertions.items():
            table_assertions: CommentedSeq = ta[table]['tests']
            for callback in self.recommended_rule_callbacks:
                assertion: RecommendedAssertion = callback(table, None, profiling_result)
                if assertion:
                    table_assertions.append(CommentedMap({
                        'name': assertion.name,
                        'assert': CommentedMap(assertion.asserts),
                        'tags': [RECOMMENDED_ASSERTION_TAG]
                    }))
                    assertion.table = table
                    self.generated_assertions.append(assertion)
            for column, col in ta[table]['columns'].items():
                column_assertions = col['tests']
                for callback in self.recommended_rule_callbacks:
                    assertion: RecommendedAssertion = callback(table, column, profiling_result)
                    if not assertion:
                        continue

                    assertion.table = table
                    assertion.column = column
                    if assertion.asserts:
                        column_assertions.append(CommentedMap({
                            'name': assertion.name,
                            'assert': CommentedMap(assertion.asserts),
                            'tags': [RECOMMENDED_ASSERTION_TAG]
                        }))
                    else:
                        column_assertions.append(CommentedMap({
                            'name': assertion.name,
                            'tags': [RECOMMENDED_ASSERTION_TAG]
                        }))
                    self.generated_assertions.append(assertion)
        return self.generated_assertions

    def load_recommended_rules(self):
        for k, callback in RecommendedRules.__dict__.items():
            if isinstance(callback, Callable):
                args = inspect.signature(callback)
                parameters = list(args.parameters.keys())
                if parameters == recommended_rule_parameter_keys:
                    self.recommended_rule_callbacks.append(callback)
                    pass
        pass
