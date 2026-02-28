#!/usr/bin/env python3
"""
Check latest versions for Python dependencies across pip/poetry/uv.
Detects version conflicts and breaking changes.
"""

import json
import subprocess
import sys
import re
from typing import Dict, List, Tuple, Optional
from pathlib import Path


def run_command(cmd: List[str]) -> Tuple[int, str, str]:
    """Run a command and return exit code, stdout, stderr."""
    result = subprocess.run(cmd, capture_output=True, text=True)
    return result.returncode, result.stdout, result.stderr


def parse_version(version: str) -> Tuple[int, int, int]:
    """Parse semantic version string into (major, minor, patch)."""
    match = re.match(r'(\d+)\.(\d+)\.(\d+)', version)
    if match:
        return int(match.group(1)), int(match.group(2)), int(match.group(3))
    return (0, 0, 0)


def detect_package_manager() -> str:
    """Detect which Python package manager is being used."""
    if Path('uv.lock').exists():
        return 'uv'
    elif Path('poetry.lock').exists():
        return 'poetry'
    elif Path('pyproject.toml').exists():
        with open('pyproject.toml', 'r') as f:
            content = f.read()
            if '[tool.poetry]' in content:
                return 'poetry'
            elif '[tool.uv]' in content:
                return 'uv'
    return 'pip'


def get_latest_version_pip(package: str) -> Optional[str]:
    """Get the latest version of a package from PyPI using pip."""
    code, stdout, _ = run_command(['pip', 'index', 'versions', package])
    if code == 0:
        # Parse output like: "package (1.2.3)"
        match = re.search(r'Available versions: ([\d.]+)', stdout)
        if match:
            return match.group(1)
        # Alternative format
        match = re.search(r'\((\d+\.\d+\.\d+)\)', stdout.split('\n')[0])
        if match:
            return match.group(1)
    return None


def parse_requirements_txt(file_path: str = 'requirements.txt') -> Dict[str, str]:
    """Parse requirements.txt file and return package: version dict."""
    packages = {}
    try:
        with open(file_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#'):
                    # Handle different formats: package==1.0.0, package>=1.0.0, package
                    match = re.match(r'([a-zA-Z0-9_-]+)([>=<~!]=?)([\d.]+)?', line)
                    if match:
                        packages[match.group(1)] = match.group(3) if match.group(3) else 'any'
                    else:
                        # Just package name without version
                        pkg_name = re.match(r'([a-zA-Z0-9_-]+)', line)
                        if pkg_name:
                            packages[pkg_name.group(1)] = 'any'
    except FileNotFoundError:
        pass
    return packages


def parse_pyproject_toml() -> Dict[str, str]:
    """Parse pyproject.toml for dependencies."""
    packages = {}
    try:
        with open('pyproject.toml', 'r') as f:
            content = f.read()

        # Look for dependencies section
        dep_section = re.search(r'\[tool\.poetry\.dependencies\](.*?)(?=\[|$)', content, re.DOTALL)
        if not dep_section:
            dep_section = re.search(r'\[project\.dependencies\](.*?)(?=\[|$)', content, re.DOTALL)

        if dep_section:
            for line in dep_section.group(1).split('\n'):
                line = line.strip()
                if '=' in line and not line.startswith('#'):
                    match = re.match(r'([a-zA-Z0-9_-]+)\s*=\s*["\']([^"\']+)["\']', line)
                    if match:
                        pkg, version = match.groups()
                        # Clean version (remove ^ ~ etc)
                        version = re.sub(r'[\^~>=<]', '', version)
                        packages[pkg] = version
    except FileNotFoundError:
        pass
    return packages


def check_python_versions() -> Dict:
    """Check all Python dependencies against latest versions."""
    package_manager = detect_package_manager()

    # Get current dependencies
    current_deps = {}
    if Path('requirements.txt').exists():
        current_deps.update(parse_requirements_txt())
    if Path('pyproject.toml').exists():
        current_deps.update(parse_pyproject_toml())

    if not current_deps:
        return {'error': 'No Python dependencies found (requirements.txt or pyproject.toml)'}

    results = {
        'package_manager': package_manager,
        'dependencies': {},
        'warnings': [],
        'breaking_changes': []
    }

    # Check each package
    for package, current_version in current_deps.items():
        if package == 'python':  # Skip Python version specifier
            continue

        latest = get_latest_version_pip(package)
        if latest:
            if current_version == 'any':
                results['dependencies'][package] = {
                    'current': 'not pinned',
                    'latest': latest,
                    'outdated': True,
                    'breaking_change': False
                }
            else:
                current_parsed = parse_version(current_version)
                latest_parsed = parse_version(latest)

                is_outdated = current_parsed < latest_parsed
                is_breaking = current_parsed[0] < latest_parsed[0]

                results['dependencies'][package] = {
                    'current': current_version,
                    'latest': latest,
                    'outdated': is_outdated,
                    'breaking_change': is_breaking
                }

                if is_breaking:
                    results['breaking_changes'].append(
                        f"{package}: {current_version} → {latest} (major version change)"
                    )

    return results


def format_output(results: Dict) -> str:
    """Format the results into a readable string."""
    if 'error' in results:
        return f"Error: {results['error']}"

    output = []
    output.append(f"\n🐍 Package Manager: {results['package_manager']}\n")

    # Dependencies
    if results['dependencies']:
        output.append("Dependencies:")
        for pkg, info in results['dependencies'].items():
            status = "✅" if not info['outdated'] else "⚠️" if info['breaking_change'] else "📌"
            output.append(f"  {status} {pkg}: {info['current']} → {info['latest']}")

    # Breaking changes warning
    if results['breaking_changes']:
        output.append("\n⚠️  Breaking Changes Detected:")
        for warning in results['breaking_changes']:
            output.append(f"  - {warning}")

    return "\n".join(output)


if __name__ == '__main__':
    results = check_python_versions()
    print(format_output(results))

    # Output JSON for programmatic use
    if '--json' in sys.argv:
        print("\n" + json.dumps(results, indent=2))
