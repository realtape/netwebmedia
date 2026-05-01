#!/usr/bin/env python3
"""
Sync reports from local /reports/ directory to Google Drive weekly.
Called by GitHub Actions workflow; requires GOOGLE_SERVICE_ACCOUNT_JSON secret.
"""

import sys
import json
import os
from pathlib import Path
from datetime import datetime
import httplib2
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from google.oauth2 import service_account

SCOPES = ['https://www.googleapis.com/auth/drive']
REPORTS_DIR = Path(__file__).parent.parent / 'reports'
GDRIVE_FOLDER_ID = os.getenv('GDRIVE_REPORTS_FOLDER_ID', '')  # Must be set as env var

def authenticate():
    """Authenticate with Google Drive API using service account."""
    creds_json = os.getenv('GOOGLE_SERVICE_ACCOUNT_JSON', '')
    if not creds_json:
        print('ERROR: GOOGLE_SERVICE_ACCOUNT_JSON env var not set')
        sys.exit(1)

    creds_dict = json.loads(creds_json)
    credentials = service_account.Credentials.from_service_account_info(
        creds_dict, scopes=SCOPES
    )
    return build('drive', 'v3', credentials=credentials)

def get_or_create_folder(service, parent_id, folder_name):
    """Get folder by name or create if not exists."""
    query = f"name='{folder_name}' and mimeType='application/vnd.google-apps.folder' and trashed=false"
    if parent_id:
        query += f" and parents='{parent_id}'"

    results = service.files().list(
        q=query,
        spaces='drive',
        fields='files(id, name)',
        pageSize=1
    ).execute()

    files = results.get('files', [])
    if files:
        return files[0]['id']

    # Create folder
    file_metadata = {
        'name': folder_name,
        'mimeType': 'application/vnd.google-apps.folder'
    }
    if parent_id:
        file_metadata['parents'] = [parent_id]

    folder = service.files().create(
        body=file_metadata,
        fields='id'
    ).execute()
    return folder.get('id')

def sync_reports_to_gdrive(service, reports_dir, gdrive_folder_id):
    """Recursively sync reports directory to Google Drive."""
    if not gdrive_folder_id:
        print('ERROR: GDRIVE_REPORTS_FOLDER_ID not set')
        sys.exit(1)

    synced_count = 0
    errors = []

    # Sync each subdirectory (executive, finance, sales, etc.)
    for subdir in reports_dir.iterdir():
        if not subdir.is_dir() or subdir.name.startswith('.'):
            continue

        print(f'→ Syncing {subdir.name}/')

        # Get or create folder in Google Drive
        gd_subdir_id = get_or_create_folder(service, gdrive_folder_id, subdir.name)

        # Sync JSON files in this directory
        for json_file in subdir.glob('*.json'):
            try:
                # Check if file exists in Google Drive
                query = f"name='{json_file.name}' and parents='{gd_subdir_id}' and trashed=false"
                results = service.files().list(
                    q=query,
                    spaces='drive',
                    fields='files(id)',
                    pageSize=1
                ).execute()

                files = results.get('files', [])

                # Upload (create or update)
                file_metadata = {'name': json_file.name}
                media = MediaFileUpload(str(json_file), mimetype='application/json', resumable=True)

                if files:
                    # Update existing
                    file_id = files[0]['id']
                    service.files().update(
                        fileId=file_id,
                        body=file_metadata,
                        media_body=media,
                        fields='id'
                    ).execute()
                    print(f'  ✓ updated {json_file.name}')
                else:
                    # Create new
                    file_metadata['parents'] = [gd_subdir_id]
                    service.files().create(
                        body=file_metadata,
                        media_body=media,
                        fields='id'
                    ).execute()
                    print(f'  ✓ created {json_file.name}')

                synced_count += 1
            except Exception as e:
                error_msg = f'{json_file.name}: {str(e)}'
                print(f'  ✗ {error_msg}')
                errors.append(error_msg)

    return synced_count, errors

def main():
    if not REPORTS_DIR.exists():
        print(f'ERROR: {REPORTS_DIR} not found')
        sys.exit(1)

    print(f'Syncing {REPORTS_DIR} to Google Drive...')
    print(f'Target folder ID: {GDRIVE_FOLDER_ID}')

    service = authenticate()
    synced_count, errors = sync_reports_to_gdrive(service, REPORTS_DIR, GDRIVE_FOLDER_ID)

    print(f'\nSync complete: {synced_count} files synced')
    if errors:
        print(f'Errors: {len(errors)}')
        for error in errors[:5]:
            print(f'  - {error}')
        if len(errors) > 5:
            print(f'  ... and {len(errors) - 5} more')
        sys.exit(1)

if __name__ == '__main__':
    main()
