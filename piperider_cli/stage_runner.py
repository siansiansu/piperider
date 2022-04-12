import json
import os
import shutil
import sys
import time

import click
import pandas as pd

from piperider_cli.config import load_stages
from piperider_cli.data import execute_ge_checkpoint

PIPERIDER_CONFIG_PATH = os.path.join(os.path.expanduser("~"), ".config/piperider")
PIPERIDER_RUN_CONFIG = f'{PIPERIDER_CONFIG_PATH}/run.json'


def write_run_config(stage_files: list, keep_ge_workspace: bool):
    run_config = dict({
        'last_time': time.time(),
        'stage_files': stage_files,
        'keep_ge_workspace': keep_ge_workspace,
        'workspace': os.getcwd(),
    })

    if not os.path.isdir(PIPERIDER_CONFIG_PATH):
        os.mkdir(PIPERIDER_CONFIG_PATH)

    with open(PIPERIDER_RUN_CONFIG, 'w') as fd:
        os.utime(PIPERIDER_RUN_CONFIG, None)
        json.dump(run_config, fd)
        fd.close()
    pass


def read_run_config():
    if not os.path.isfile(PIPERIDER_RUN_CONFIG):
        return None
    with open(PIPERIDER_RUN_CONFIG, 'r') as fd:
        run_config = json.load(fd)
        fd.close()
    return run_config


def refine_ydata_result(results: dict):
    outputs = {}
    for k, v in results.items():
        if 'Expectation Level Assessment' == k:
            refined_assessment = list(v)
            for idx, elem in enumerate(refined_assessment):
                if isinstance(elem, pd.DataFrame):
                    refined_assessment[idx] = elem.to_json(orient='table')
            outputs[k] = refined_assessment
        else:
            outputs[k] = v
    return outputs


def run_stages(all_stage_files, keep_ge_workspace: bool):
    write_run_config(all_stage_files, keep_ge_workspace)
    for stage_file in all_stage_files:
        try:
            stage_content: dict = load_stages(stage_file)
        except Exception as e:
            click.echo(f'Error: file {stage_file}: {e}')
            sys.exit(1)

        for stage_name in stage_content.keys():
            click.echo(f'Process stage [{os.path.basename(stage_file).split(".")[0]}:{stage_name}]')
            current_stage = stage_content[stage_name]
            source_name = current_stage['data']
            source_file = os.path.abspath(
                os.path.join(os.path.dirname(stage_file), '../sources', f'{source_name}.yaml'))

            from tempfile import TemporaryDirectory
            with TemporaryDirectory() as tmpdir:
                ge_workspace = tmpdir

                if keep_ge_workspace:
                    ge_workspace = os.path.join(os.getcwd(), f'ge_dir_{int(time.time())}')
                    print(f"keep ge workspace at {ge_workspace}")

                try:
                    all_columns = execute_ge_checkpoint(ge_workspace, source_file, stage_file, stage_name)
                    report_file = copy_report(ge_workspace, stage_file, stage_name)
                    print(f"create report at {report_file}")

                    # generate ydata report
                    import pandas as pd
                    from piperider_cli.ydata.data_expectations import DataExpectationsReporter
                    df = pd.DataFrame(columns=all_columns)
                    print("columns: ", all_columns)
                    der = DataExpectationsReporter()
                    results = der.evaluate(report_file, df)
                    # TODO more report from results
                    expectations_report, expectations_dense = results['Expectation Level Assessment']
                    expectations_report
                    print(expectations_report)

                    ydata_report = report_file.replace('.json', '_ydata.json')
                    print(f"create ydata report at {ydata_report}")
                    with open(ydata_report, 'w') as fh:
                        fh.write(json.dumps(refine_ydata_result(results)))

                except Exception as e:
                    click.echo(f'Skipped: Stage [{stage_file}::{stage_name}]: Error: {e}')
                    continue


def copy_report(ge_workspace, stage_file, stage_name):
    # TODO each stage should have its report file
    for root, dirs, files in os.walk(ge_workspace):
        for f in files:
            if f.endswith('.json') and 'uncommitted' in root:
                report_json = os.path.join(root, f)
                filename = os.path.basename(stage_file).split('.')[0]
                report_name = f'{filename}_{stage_name}_{os.path.basename(report_json)}'
                shutil.copy(report_json, os.path.join('.', report_name))
                return report_name
