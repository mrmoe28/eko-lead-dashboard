-- AppleScript to set up GitHub secrets for Vercel deployment
-- This script automates adding secrets to the GitHub repository

tell application "Safari"
	activate

	-- GitHub secrets page
	set githubURL to "https://github.com/mrmoe28/eko-lead-dashboard/settings/secrets/actions"
	open location githubURL

	delay 3

	tell application "System Events"
		tell process "Safari"
			-- Wait for page to load
			delay 2

			-- Vercel Project ID
			try
				click button "New repository secret" of window 1
				delay 1

				keystroke "VERCEL_PROJECT_ID"
				keystroke tab
				keystroke "prj_XyDZkNAVnB3sg647dwTMBlCdiG7z"
				keystroke return
				delay 2

				display notification "VERCEL_PROJECT_ID added" with title "GitHub Secrets"
			on error errMsg
				display dialog "Error adding VERCEL_PROJECT_ID: " & errMsg buttons {"OK"} default button 1
			end try

			delay 1

			-- Vercel Org ID
			try
				click button "New repository secret" of window 1
				delay 1

				keystroke "VERCEL_ORG_ID"
				keystroke tab
				keystroke "team_FFRrO5azOZd2n35vLPL64lag"
				keystroke return
				delay 2

				display notification "VERCEL_ORG_ID added" with title "GitHub Secrets"
			on error errMsg
				display dialog "Error adding VERCEL_ORG_ID: " & errMsg buttons {"OK"} default button 1
			end try

			delay 1

			-- Note: VERCEL_TOKEN needs to be manually copied from Vercel dashboard
			display dialog "Now you need to add VERCEL_TOKEN manually. Go to vercel.com/account/tokens to create one." buttons {"OK"} default button 1

		end tell
	end tell
end tell
