import os.path
import sys

import click

from piperider_cli import workspace
from piperider_cli.stage_runner import run_stages, read_run_config


@click.group()
def cli():
    pass


@cli.command()
def init():
    # TODO show the process and message to users
    click.echo(f'Initialize piperider to path {os.getcwd()}/piperider')
    workspace.init()


@cli.command()
@click.option('--stage', help='stage file')
@click.option('--keep-ge-workspace', is_flag=True, default=False)
def run(**kwargs):
    # TODO check the args are "stages" files
    # invoke the stage -> piperider_cli.data.execute_great_expectation
    # generate the report file or directory
    stage_inputs: str = kwargs.get('stage')
    keep_ge_workspace: bool = kwargs.get('keep_ge_workspace')

    previous_run_config = read_run_config()

    if stage_inputs is None and previous_run_config is None:
        click.echo(f'--stage is required')
        sys.exit(1)
    elif stage_inputs is not None:
        if os.path.isdir(stage_inputs):
            all_stage_files = []
            for yaml_file in os.listdir(stage_inputs):
                if yaml_file.endswith('.yaml') or yaml_file.endswith('.yml'):
                    all_stage_files.append(os.path.abspath(os.path.join(stage_inputs, yaml_file)))
        elif not os.path.exists(stage_inputs):
            click.echo(f'Cannot find the stage file: {stage_inputs}')
            sys.exit(1)
        else:
            all_stage_files = [os.path.abspath(stage_inputs)]
    else:
        click.echo(f'Load previous run config from ~/.config/piperider/run.yaml')
        all_stage_files = previous_run_config.get('stage_files')
        keep_ge_workspace = previous_run_config.get('keep_ge_workspace')
        os.chdir(previous_run_config.get('workspace'))

    run_stages(all_stage_files, keep_ge_workspace)
