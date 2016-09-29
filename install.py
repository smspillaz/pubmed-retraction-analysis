#!/usr/bin/env python
#
# Install the project and dependencies

import contextlib
import errno
from io import BytesIO
import os
import platform
import stat
import subprocess
import tarfile

try:
    from urllib.request import urlopen
except ImportError:
    from urllib import urlopen


def run_task(desc, *args):
    """Run a task and print out a description for it."""
    print("=> " + desc)
    subprocess.check_call(args)


def get_dependency(executable):
    """Check if a particular dependency is available.

    This check is particularly ugly because we need to traverse PATH
    and PATHEXT in order to discover executables which match the description.

    Return the first patch for the executable that we find on the filesystem.
    """
    paths = os.environ.get("PATH", "").split(os.pathsep)
    for path in paths:
        # Note that on UNIX systems, this will work because we will get a
        # single entry for the empty string.
        for ext in os.environ.get("PATHEXT", "").split(";"):
            candidate = os.path.join(path, executable) + ext
            try:
                stat_result = os.stat(candidate)

                # On UNIX systems we need to check if the execute
                # bit is set.
                if platform.system() != "Windows":
                    if stat_result.st_mode & stat.S_IXUSR == 0:
                        continue
            except OSError as error:
                if error.errno == errno.ENOENT:
                    continue
                else:
                    raise error

            return candidate

    return None


def get_dependency_or_fail(executable):
    """Get a dependency's full path, or throw an error."""
    dependency = get_dependency(executable)
    if not dependency:
        raise RuntimeError("Couldn't find {} in PATH / PATHEXT".format(executable))

    return dependency


def main(argv):
    """Start the script.

    Check dependencies and then run installation tasks.
    """
    dependencies = ["python", "npm", "node", "virtualenv"]
    dependencies_map = {
        k: get_dependency_or_fail(k) for k in dependencies
    }

    # Now start installing stuff
    if not os.path.isdir("python-virtualenv"):
        add_args = (["--python=" + os.environ["PYTHON"]]
                    if os.environ.get("PYTHON", None) else [])
        run_task("Creating virtual environment",
                 *(add_args + ["virtualenv", "python-virtualenv"]))

    run_task("Installing python dependencies",
             os.path.join("python-virtualenv", "bin", "pip"),
             "install", "-r", "requirements.txt")
    run_task("Installing python project",
             os.path.join("python-virtualenv", "bin", "python"),
             "setup.py", "install")
    run_task("Installing node dependencies", "npm", "install")

    if not os.environ.get("TRAVIS", None):
        print("=> Downloading and installing local neo4j (may take some time)")
        url = urlopen("http://dist.neo4j.org/"
                      "neo4j-community-2.2.0-M03-unix.tar.gz")
        with contextlib.closing(url) as neo4j_remote:
            membuf = BytesIO()
            membuf.write(neo4j_remote.read())
            membuf.seek(0)
            with tarfile.open(fileobj=membuf) as neo4j_tar:
                print("\n".join([t.name for t in neo4j_tar.getmembers()]))
                neo4j_tar.extractall(path=os.path.join(os.getcwd(), "neo4j"))

    print("Project installed. Enter the Python Virtual Environment with ")
    print("$ source python-virtualenv/bin/activate")


if __name__ == "__main__":
    main(None)
