-- AppleScript to create Vercel Deploy Hook
-- This script automates the Vercel dashboard to create a deploy hook

tell application "Safari"
	activate

	-- Open Vercel project settings
	set vercelURL to "https://vercel.com/ekoapps/eko-lead-dashboard/settings/git"
	open location vercelURL

	delay 3

	tell application "System Events"
		tell process "Safari"
			-- Wait for page to load
			delay 2

			-- Scroll down to Deploy Hooks section
			repeat 5 times
				key code 125 -- Down arrow
				delay 0.2
			end repeat

			-- Look for "Create Hook" button and click it
			-- Note: This requires accessibility permissions
			try
				click button "Create Hook" of window 1
				delay 1

				-- Fill in the hook name
				keystroke "main-auto-deploy"
				delay 0.5

				-- Tab to branch selector
				keystroke tab
				delay 0.5

				-- Select "main" branch (assuming it's the first option)
				keystroke return
				delay 0.5

				-- Click Create button
				keystroke return
				delay 2

				-- Copy the webhook URL (it should be displayed)
				keystroke "c" using command down
				delay 0.5

				-- Save to clipboard file
				do shell script "pbpaste > /Users/ekodevapps/Desktop/ekoleadgenerator/eko-lead-dashboard/.vercel-deploy-hook-url"

				display notification "Deploy Hook created and saved!" with title "Vercel Automation"

			on error errMsg
				display dialog "Error: " & errMsg buttons {"OK"} default button 1
			end try
		end tell
	end tell
end tell
