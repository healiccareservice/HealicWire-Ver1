const fs = require('fs');
const file = 'frontend/src/components/AdminCMS.tsx';
let content = fs.readFileSync(file, 'utf-8');

// 1. Re-apply the dropdown filter
const oldDropdown = `                            <option value="">-- Choose Events managed by us --</option>
                            {availablePages.map(page => (
                              <option key={page.id} value={page.title}>`;

const newDropdown = `                            <option value="">-- Choose Events managed by us --</option>
                            {availablePages
                              .filter(page => page.title.startsWith("Scientific Events:"))
                              .map(page => (
                              <option key={page.id} value={page.title}>`;

content = content.replace(oldDropdown, newDropdown);

// 2. Insert the state and handler
const stateTarget = `  const [manageSuccess, setManageSuccess] = useState<string | null>(null);
  const [attendeeSearch, setAttendeeSearch] = useState<string>("");`;

const newState = `  const [manageSuccess, setManageSuccess] = useState<string | null>(null);
  const [attendeeSearch, setAttendeeSearch] = useState<string>("");

  const [showAddAttendeeModal, setShowAddAttendeeModal] = useState(false);
  const [newAttendee, setNewAttendee] = useState({
    name: "",
    email: "",
    regNo: "",
    specialty: "",
    cmeHours: "12.0"
  });

  const handleAddParticipantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newRecord = {
      name: newAttendee.name,
      email: newAttendee.email,
      regNo: newAttendee.regNo,
      councilNo: newAttendee.regNo,
      specialty: newAttendee.specialty,
      cmeHours: newAttendee.cmeHours
    };
    
    setAttendeeFile(prev => {
      const attendees = prev?.attendees || [];
      return {
        fileName: prev?.fileName || "Manual Entry",
        fileSize: prev?.fileSize || "N/A",
        totalCount: attendees.length + 1,
        attendees: [newRecord, ...attendees],
        uploadedAt: prev?.uploadedAt || new Date().toLocaleString()
      } as any;
    });
    setShowAddAttendeeModal(false);
    setNewAttendee({ name: "", email: "", regNo: "", specialty: "", cmeHours: "12.0" });
  };`;

content = content.replace(stateTarget, newState);

// 3. Replace the alert with setShowAddAttendeeModal(true)
const alertCall = `onClick={() => alert('Add Participant One by One - Coming Soon')}`;
const modalCall = `onClick={() => setShowAddAttendeeModal(true)}`;
content = content.replace(alertCall, modalCall);

// 4. Insert Modal JSX at the bottom
const bottomTarget = `        </main>
      </div>
    </div>
  );
}`;

const modalJSX = `        </main>
      </div>

      {/* Add Participant Modal */}
      {showAddAttendeeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 w-full max-w-md border border-zinc-200 dark:border-zinc-800 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                Add Participant
              </h3>
              <button onClick={() => setShowAddAttendeeModal(false)} className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddParticipantSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Full Name *</label>
                <input required type="text" value={newAttendee.name} onChange={e => setNewAttendee({...newAttendee, name: e.target.value})} className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500" placeholder="Dr. Jane Doe" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Email Address *</label>
                <input required type="email" value={newAttendee.email} onChange={e => setNewAttendee({...newAttendee, email: e.target.value})} className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500" placeholder="jane.doe@example.com" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Medical Council Reg. No.</label>
                <input type="text" value={newAttendee.regNo} onChange={e => setNewAttendee({...newAttendee, regNo: e.target.value})} className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500" placeholder="NMC-12345" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Specialty / Department</label>
                <input type="text" value={newAttendee.specialty} onChange={e => setNewAttendee({...newAttendee, specialty: e.target.value})} className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500" placeholder="Cardiology" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">CME Credits Awarded</label>
                <input type="text" value={newAttendee.cmeHours} onChange={e => setNewAttendee({...newAttendee, cmeHours: e.target.value})} className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="pt-4 flex justify-end space-x-3 border-t border-zinc-200 dark:border-zinc-800 mt-2">
                <button type="button" onClick={() => setShowAddAttendeeModal(false)} className="px-4 py-2 rounded-xl text-sm font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  Add Participant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}`;

content = content.replace(bottomTarget, modalJSX);

fs.writeFileSync(file, content, 'utf-8');
console.log('Successfully injected modal');
