-- AppleScript to create Vercel API token and add it to GitHub secrets
-- This script automates the Vercel dashboard and GitHub settings

tell application "Safari"
	activate

	-- Step 1: Create Vercel token
	set vercelTokenURL to "https://vercel.com/account/tokens"
	open location vercelTokenURL

	delay 3

	tell application "System Events"
		tell process "Safari"
			-- Wait for page to load
			delay 2

			try
				-- Click "Create" button
				click button "Create" of window 1
				delay 1

				-- Fill in token name
				keystroke "github-actions-deploy"
				delay 0.5

				-- Select scope (Full Account)
				keystroke tab
				delay 0.5

				-- Click Create button
				keystroke return
				delay 2

				-- Select and copy the token
				keystroke "a" using command down
				delay 0.3
				keystroke "c" using command down
				delay 0.5

				set vercelToken to the clipboard

				display notification "Vercel token created: " & (text 1 thru 20 of vercelToken) & "..." with title "Vercel Automation"

				-- Step 2: Add to GitHub secrets
				delay 1

				set githubSecretsURL to "https://github.com/mrmoe28/eko-lead-dashboard/settings/secrets/actions"
				open location githubSecretsURL

				delay 3

				-- Click New repository secret
				click button "New repository secret" of window 1
				delay 1

				-- Fill in secret name
				keystroke "VERCEL_TOKEN"
				keystroke tab

				-- Paste token
				keystroke "v" using command down
				delay 0.5

				-- Click Add secret
				keystroke return
				delay 2

				display notification "VERCEL_TOKEN added to GitHub secrets!" with title "Setup Complete"

				-- Save token to file for backup
				do shell script "echo '" & vercelToken & "' > /Users/ekodevapps/Desktop/ekoleadgenerator/eko-lead-dashboard/.vercel-token"

			on error errMsg
				display dialog "Error: " & errMsg buttons {"OK"} default button 1
			end try
		end tell
	end tell
end tell
