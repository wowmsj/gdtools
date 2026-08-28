import subprocess
import sys
import os
import urllib.request
import json

def run(cmd, capture=True):
    result = subprocess.run(cmd, shell=True, capture_output=capture, text=True)
    if capture and result.stdout:
        print(result.stdout, end='')
    if capture and result.stderr:
        print(result.stderr, end='')
    return result.returncode

def create_github_repo(username, token, repo_name):
    """通过 GitHub API 创建仓库"""
    url = "https://api.github.com/user/repos"
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json",
        "Content-Type": "application/json"
    }
    data = json.dumps({
        "name": repo_name,
        "private": False,
        "auto_init": False
    }).encode('utf-8')
    
    req = urllib.request.Request(url, data=data, headers=headers, method='POST')
    try:
        response = urllib.request.urlopen(req)
        if response.status == 201:
            return True
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        try:
            error_json = json.loads(error_body)
            if "already exists" in error_body:
                print(f"Repo '{repo_name}' already exists, will push to it.")
                return True
            print(f"GitHub API error: {error_json.get('message', error_body)}")
        except:
            print(f"GitHub API error: {error_body}")
    except Exception as e:
        print(f"Failed to create repo: {e}")
    return False

print("=" * 50)
print("   GitHub Push Helper")
print("=" * 50)
print()

os.chdir(os.path.dirname(os.path.abspath(__file__)))
print(f"Current dir: {os.getcwd()}")
print()

username = input("GitHub username: ").strip()
token = input("GitHub Token: ").strip()
repo = input("Repo name (e.g. gacha-sim): ").strip()

print()
print("Creating repo if not exists...")
if not create_github_repo(username, token, repo):
    print("Failed to create repo. Check your token has 'repo' permission.")
    input("\nPress Enter to exit...")
    sys.exit(1)

remote_url = f"https://{username}:{token}@github.com/{username}/{repo}.git"

print("Pushing...")
run("git remote remove origin 2>nul")
run(f'git remote add origin "{remote_url}"')
ret = run("git push -u origin main")

print()
if ret == 0:
    print(f"SUCCESS! Repo: https://github.com/{username}/{repo}")
else:
    print("FAILED. Check:")
    print("  1. Token has 'repo' permission")
    print("  2. Repo name is correct")
    print("  3. Internet connection is OK")

input("\nPress Enter to exit...")
