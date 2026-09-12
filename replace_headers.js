const fs = require('fs');

function replaceHeader(filePath, panelName) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace <header> ... </header> block
  const headerStart = content.indexOf('<header');
  const headerEnd = content.indexOf('</header>') + '</header>'.length;

  if (headerStart === -1 || headerEnd === -1) {
    console.error('Could not find header in ' + filePath);
    return;
  }

  // Also remove the old mobile menu if it exists
  const oldMobileMenuStart = content.indexOf('{mobileMenuOpen && (');
  let oldMobileMenuEnd = -1;
  if (oldMobileMenuStart !== -1) {
    // Find the end of this block by finding the matching closing brace.
    let braceCount = 0;
    let inString = false;
    let escape = false;
    for (let i = oldMobileMenuStart; i < content.length; i++) {
      if (content[i] === '"' && !escape) inString = !inString;
      if (content[i] === '\\') escape = !escape;
      else escape = false;

      if (!inString) {
        if (content[i] === '{') braceCount++;
        if (content[i] === '}') {
          braceCount--;
          if (braceCount === 0) {
            oldMobileMenuEnd = i + 1;
            break;
          }
        }
      }
    }
  }

  let finalContent = content;

  if (oldMobileMenuStart !== -1 && oldMobileMenuEnd !== -1) {
    console.log('Removing old mobile menu from ' + filePath);
    finalContent = finalContent.substring(0, oldMobileMenuStart) + finalContent.substring(oldMobileMenuEnd);
  }

  // Find the new start/end indices after removing mobile menu
  const newHeaderStart = finalContent.indexOf('<header');
  const newHeaderEnd = finalContent.indexOf('</header>') + '</header>'.length;

  let replacement = '';
  if (filePath.includes('intern.tsx')) {
    replacement = \
        <div className="relative z-50">
          <DashboardHeader 
            panelName="Intern Portal"
            userProfileName={displayName}
            onSignOut={handleSignOut}
            links={[
              { href: "/intern", label: "Dashboard Home", icon: Sparkles },
              { href: "#", onClick: () => setActiveTab("notifications"), label: "Notifications & Tasks", icon: Bell },
              { href: "#", onClick: () => setActiveTab("schedule"), label: "Meetings & Schedule", icon: Clock },
              { href: "#", onClick: () => setActiveTab("resources"), label: "Learning & Resources", icon: BookOpen },
              { href: "#", onClick: () => setActiveTab("leaves"), label: "Leave Management", icon: ClipboardList }
            ]}
          />
        </div>
\;
  } else if (filePath.includes('employee.tsx')) {
    replacement = \
        <div className="relative z-50">
          <DashboardHeader 
            panelName="Employee Portal"
            userProfileName={displayName}
            onSignOut={handleSignOut}
            links={[
              { href: "/employee", label: "Dashboard Home", icon: Sparkles },
              { href: "#", onClick: () => setActiveTab("notifications"), label: "Notifications & Tasks", icon: Bell },
              { href: "#", onClick: () => setActiveTab("schedule"), label: "Meetings & Schedule", icon: Clock },
              { href: "#", onClick: () => setActiveTab("resources"), label: "Knowledge Base", icon: BookOpen },
              { href: "#", onClick: () => setActiveTab("leaves"), label: "Leave Management", icon: ClipboardList }
            ]}
          />
        </div>
\;
  }

  finalContent = finalContent.substring(0, newHeaderStart) + replacement + finalContent.substring(newHeaderEnd);
  
  // Ensure import DashboardHeader is present
  if (!finalContent.includes("import { DashboardHeader }")) {
    finalContent = "import { DashboardHeader } from '@/components/dashboard-header';\n" + finalContent;
  }

  fs.writeFileSync(filePath, finalContent, 'utf8');
  console.log('Replaced header in ' + filePath);
}

replaceHeader('src/routes/_authenticated/intern.tsx', 'Intern Portal');
replaceHeader('src/routes/_authenticated/employee.tsx', 'Employee Portal');

