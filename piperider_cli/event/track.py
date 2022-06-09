from click.core import Command, Context
from piperider_cli import event
import typing as t


class TrackCommand(Command):

    def __init__(
        self,
        name: t.Optional[str],
        context_settings: t.Optional[t.Dict[str, t.Any]] = None,
        callback: t.Optional[t.Callable[..., t.Any]] = None,
        params: t.Any = None,
        help: t.Optional[str] = None,
        epilog: t.Optional[str] = None,
        short_help: t.Optional[str] = None,
        options_metavar: t.Optional[str] = "[OPTIONS]",
        add_help_option: bool = True,
        no_args_is_help: bool = False,
        hidden: bool = False,
        deprecated: bool = False,
    ) -> None:
        super(TrackCommand, self).__init__(name, context_settings, callback, params, help, epilog, short_help,
                                           options_metavar, add_help_option, no_args_is_help, hidden, deprecated)

    def invoke(self, ctx: Context) -> t.Any:
        status = False
        try:
            ret = super(TrackCommand, self).invoke(ctx)
            status = True
            return ret
        except Exception:
            # TODO errors
            raise
        finally:
            event.log_event(ctx.command.name, ctx.params, status)
            pass