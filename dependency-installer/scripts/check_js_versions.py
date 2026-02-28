#!/usr/bin/env python3
"""
Check latest versions for JavaScript dependencies across npm/pnpm/yarn/bun.
Detects version conflicts and breaking changes.
"""

import json
import subprocess
import sys
from typing import Dict, List, Tuple, Optional
import re


def run_command(cmd: List[str]) -> Tuple[int, str, str]:
    """Run a command and return exit code, stdout, stderr."""
    result = subprocess.run(cmd, capture_output=True, text=True)
    return result.returncode, result.stdout, result.stderr


def parse_version(version: str) -> Tuple[int, int, int]:
    """Parse semantic version string into (major, minor, patch)."""
    match = re.match(r'(\d+)\.(\d+)\.(\d+)', version.lstrip('^~'))
    if match:
        return int(match.group(1)), int(match.group(2)), int(match.group(3))
    return (0, 0, 0)


def detect_package_manager() -> str:
    """Detect which package manager is being used in the current project."""
    # Check for lockfiles
    lockfile_checks = [
        ('bun.lockb', 'bun'),
        ('pnpm-lock.yaml', 'pnpm'),
        ('yarn.lock', 'yarn'),
        ('package-lock.json', 'npm'),
    ]

    for lockfile, manager in lockfile_checks:
        code, _, _ = run_command(['test', '-f', lockfile])
        if code == 0:
            return manager

    # Default to npm if no lockfile found
    return 'npm'


def get_latest_version(package: str) -> Optional[str]:
    """Get the latest version of a package from npm registry."""
    code, stdout, _ = run_command(['npm', 'view', package, 'version'])
    if code == 0:
        return stdout.strip()
    return None


def get_package_info(package: str, version: str) -> Dict:
    """Get detailed package information including peer dependencies."""
    code, stdout, _ = run_command(['npm', 'view', f'{package}@{version}', 'peerDependencies', '--json'])
    peer_deps = {}
    if code == 0 and stdout.strip():
        try:
            peer_deps = json.loads(stdout)
        except json.JSONDecodeError:
            pass

    return {
        'version': version,
        'peerDependencies': peer_deps or {}
    }


def check_package_json_versions(package_json_path: str = 'package.json') -> Dict:
    """Check all dependencies in package.json against latest versions."""
    try:
        with open(package_json_path, 'r') as f:
            package_data = json.load(f)
    except FileNotFoundError:
        return {'error': 'package.json not found'}
    except json.JSONDecodeError:
        return {'error': 'Invalid package.json'}

    results = {
        'package_manager': detect_package_manager(),
        'dependencies': {},
        'devDependencies': {},
        'warnings': [],
        'breaking_changes': []
    }

    # Check dependencies
    for dep_type in ['dependencies', 'devDependencies']:
        deps = package_data.get(dep_type, {})
        for package, current_version in deps.items():
            latest = get_latest_version(package)
            if latest:
                current_clean = current_version.lstrip('^~')
                current_parsed = parse_version(current_clean)
                latest_parsed = parse_version(latest)

                is_outdated = current_parsed < latest_parsed
                is_breaking = current_parsed[0] < latest_parsed[0]

                results[dep_type][package] = {
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
    output.append(f"\n📦 Package Manager: {results['package_manager']}\n")

    # Dependencies
    if results['dependencies']:
        output.append("Dependencies:")
        for pkg, info in results['dependencies'].items():
            status = "✅" if not info['outdated'] else "⚠️" if info['breaking_change'] else "📌"
            output.append(f"  {status} {pkg}: {info['current']} → {info['latest']}")

    # Dev Dependencies
    if results['devDependencies']:
        output.append("\nDev Dependencies:")
        for pkg, info in results['devDependencies'].items():
            status = "✅" if not info['outdated'] else "⚠️" if info['breaking_change'] else "📌"
            output.append(f"  {status} {pkg}: {info['current']} → {info['latest']}")

    # Breaking changes warning
    if results['breaking_changes']:
        output.append("\n⚠️  Breaking Changes Detected:")
        for warning in results['breaking_changes']:
            output.append(f"  - {warning}")

    return "\n".join(output)


if __name__ == '__main__':
    package_json = sys.argv[1] if len(sys.argv) > 1 else 'package.json'
    results = check_package_json_versions(package_json)
    print(format_output(results))

    # Output JSON for programmatic use
    if '--json' in sys.argv:
        print("\n" + json.dumps(results, indent=2))
