const fs = require('fs');
const file = 'frontend/src/components/AdminCMS.tsx';
let content = fs.readFileSync(file, 'utf-8');

// 1. Update the state for the modal
const oldStateStart = `  const [showAddAttendeeModal, setShowAddAttendeeModal] = useState(false);`;
const oldStateEnd = `  };`;

// We'll replace by extracting the bounds
const idx1 = content.indexOf(oldStateStart);
const idx2 = content.indexOf(oldStateEnd, idx1);

const newStateFull = `  const [showAddAttendeeModal, setShowAddAttendeeModal] = useState(false);
  const [editAttendeeId, setEditAttendeeId] = useState<string | null>(null);
  const [newAttendee, setNewAttendee] = useState({
    id: "",
    full_name: "",
    email: "",
    phone_number: "",
    specialty: "",
    designation: "",
    institution_name: "",
    medical_council_reg_number: "",
    medical_council_name: "",
    city: "",
    state_province: "",
    country: "",
    registration_type: "Delegate",
    registration_status: "Confirmed",
    cme_credits_awarded: "12.0",
    certificate_issued: "false",
    certificate_url: ""
  });

  const handleEditParticipantClick = (attendee: any, index: number) => {
    setEditAttendeeId(attendee.id || index.toString());
    setNewAttendee({
      id: attendee.id || index.toString(),
      full_name: attendee.full_name || attendee.name || "",
      email: attendee.email || "",
      phone_number: attendee.phone_number || attendee.phone || "",
      specialty: attendee.specialty || "",
      designation: attendee.designation || "",
      institution_name: attendee.institution_name || attendee.institution || "",
      medical_council_reg_number: attendee.medical_council_reg_number || attendee.regNo || attendee.councilNo || "",
      medical_council_name: attendee.medical_council_name || "",
      city: attendee.city || "",
      state_province: attendee.state_province || "",
      country: attendee.country || "",
      registration_type: attendee.registration_type || "Delegate",
      registration_status: attendee.registration_status || "Confirmed",
      cme_credits_awarded: attendee.cme_credits_awarded || attendee.cmeHours || "12.0",
      certificate_issued: attendee.certificate_issued ? "true" : "false",
      certificate_url: attendee.certificate_url || ""
    });
    setShowAddAttendeeModal(true);
  };

  const handleAddParticipantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newRecord = {
      ...newAttendee,
      id: newAttendee.id || \`REG-\${Date.now()}\`,
      name: newAttendee.full_name, // legacy fallback for existing table columns
      regNo: newAttendee.medical_council_reg_number, // legacy fallback
      councilNo: newAttendee.medical_council_reg_number,
      phone: newAttendee.phone_number,
      institution: newAttendee.institution_name,
      cmeHours: newAttendee.cme_credits_awarded,
      certificate_issued: newAttendee.certificate_issued === "true"
    };
    
    setAttendeeFile(prev => {
      const attendees = prev?.attendees ? [...prev.attendees] : [];
      if (editAttendeeId) {
        const index = attendees.findIndex((a: any, idx) => (a.id || idx.toString()) === editAttendeeId);
        if (index !== -1) {
          attendees[index] = newRecord;
        } else {
          attendees.push(newRecord);
        }
      } else {
        attendees.unshift(newRecord);
      }
      return {
        fileName: prev?.fileName || "Manual Entry",
        fileSize: prev?.fileSize || "N/A",
        totalCount: attendees.length,
        attendees: attendees,
        uploadedAt: prev?.uploadedAt || new Date().toLocaleString()
      } as any;
    });
    setShowAddAttendeeModal(false);
    setEditAttendeeId(null);
    setNewAttendee({
      id: "", full_name: "", email: "", phone_number: "", specialty: "", designation: "", institution_name: "", medical_council_reg_number: "", medical_council_name: "", city: "", state_province: "", country: "", registration_type: "Delegate", registration_status: "Confirmed", cme_credits_awarded: "12.0", certificate_issued: "false", certificate_url: ""
    });
  };`;

if (idx1 !== -1 && idx2 !== -1) {
  content = content.substring(0, idx1) + newStateFull + content.substring(idx2 + oldStateEnd.length);
}

// 2. Update the modal JSX
const oldModalStart = `      {/* Add Participant Modal */}`;
const oldModalEnd = `      )}

    </div>`;

const newModalJSX = `{/* Add Participant Modal */}
      {showAddAttendeeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 w-full max-w-4xl border border-zinc-200 dark:border-zinc-800 shadow-2xl animate-in fade-in zoom-in-95 my-auto">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                {editAttendeeId ? "Edit Participant" : "Add Participant"}
              </h3>
              <button onClick={() => { setShowAddAttendeeModal(false); setEditAttendeeId(null); }} className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddParticipantSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Basic Info */}
                <div className="col-span-1 md:col-span-2 lg:col-span-3 pb-1 border-b border-zinc-100 dark:border-zinc-800">
                  <h4 className="text-sm font-bold text-zinc-600 dark:text-zinc-400">Basic Information</h4>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Full Name *</label>
                  <input required type="text" value={newAttendee.full_name} onChange={e => setNewAttendee({...newAttendee, full_name: e.target.value})} className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500" placeholder="Dr. Jane Doe" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Email Address *</label>
                  <input required type="email" value={newAttendee.email} onChange={e => setNewAttendee({...newAttendee, email: e.target.value})} className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500" placeholder="jane.doe@example.com" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Phone Number</label>
                  <input type="text" value={newAttendee.phone_number} onChange={e => setNewAttendee({...newAttendee, phone_number: e.target.value})} className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500" placeholder="+91 9876543210" />
                </div>

                {/* Professional Info */}
                <div className="col-span-1 md:col-span-2 lg:col-span-3 pb-1 border-b border-zinc-100 dark:border-zinc-800 mt-2">
                  <h4 className="text-sm font-bold text-zinc-600 dark:text-zinc-400">Professional Details</h4>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Specialty / Department</label>
                  <input type="text" value={newAttendee.specialty} onChange={e => setNewAttendee({...newAttendee, specialty: e.target.value})} className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500" placeholder="Cardiology" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Designation</label>
                  <input type="text" value={newAttendee.designation} onChange={e => setNewAttendee({...newAttendee, designation: e.target.value})} className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500" placeholder="Consultant" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Institution Name</label>
                  <input type="text" value={newAttendee.institution_name} onChange={e => setNewAttendee({...newAttendee, institution_name: e.target.value})} className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500" placeholder="AIIMS" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Medical Council Reg. No.</label>
                  <input type="text" value={newAttendee.medical_council_reg_number} onChange={e => setNewAttendee({...newAttendee, medical_council_reg_number: e.target.value})} className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500" placeholder="NMC-12345" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Medical Council Name</label>
                  <input type="text" value={newAttendee.medical_council_name} onChange={e => setNewAttendee({...newAttendee, medical_council_name: e.target.value})} className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500" placeholder="National Medical Commission" />
                </div>

                {/* Location */}
                <div className="col-span-1 md:col-span-2 lg:col-span-3 pb-1 border-b border-zinc-100 dark:border-zinc-800 mt-2">
                  <h4 className="text-sm font-bold text-zinc-600 dark:text-zinc-400">Location</h4>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">City</label>
                  <input type="text" value={newAttendee.city} onChange={e => setNewAttendee({...newAttendee, city: e.target.value})} className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">State / Province</label>
                  <input type="text" value={newAttendee.state_province} onChange={e => setNewAttendee({...newAttendee, state_province: e.target.value})} className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Country</label>
                  <input type="text" value={newAttendee.country} onChange={e => setNewAttendee({...newAttendee, country: e.target.value})} className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500" />
                </div>

                {/* Registration Details */}
                <div className="col-span-1 md:col-span-2 lg:col-span-3 pb-1 border-b border-zinc-100 dark:border-zinc-800 mt-2">
                  <h4 className="text-sm font-bold text-zinc-600 dark:text-zinc-400">Registration Details</h4>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Registration Type</label>
                  <select value={newAttendee.registration_type} onChange={e => setNewAttendee({...newAttendee, registration_type: e.target.value})} className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500">
                    <option value="Delegate">Delegate</option>
                    <option value="Speaker">Speaker</option>
                    <option value="Exhibitor">Exhibitor</option>
                    <option value="Student">Student</option>
                    <option value="VIP">VIP</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Status</label>
                  <select value={newAttendee.registration_status} onChange={e => setNewAttendee({...newAttendee, registration_status: e.target.value})} className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500">
                    <option value="Confirmed">Confirmed</option>
                    <option value="Pending">Pending</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">CME Credits Awarded</label>
                  <input type="text" value={newAttendee.cme_credits_awarded} onChange={e => setNewAttendee({...newAttendee, cme_credits_awarded: e.target.value})} className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Certificate Issued?</label>
                  <select value={newAttendee.certificate_issued} onChange={e => setNewAttendee({...newAttendee, certificate_issued: e.target.value})} className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500">
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Certificate URL (Optional)</label>
                  <input type="text" value={newAttendee.certificate_url} onChange={e => setNewAttendee({...newAttendee, certificate_url: e.target.value})} className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500" placeholder="https://..." />
                </div>
              </div>
              <div className="pt-4 flex justify-end space-x-3 border-t border-zinc-200 dark:border-zinc-800 mt-4">
                <button type="button" onClick={() => { setShowAddAttendeeModal(false); setEditAttendeeId(null); }} className="px-4 py-2 rounded-xl text-sm font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2">
                  {editAttendeeId ? <FileEdit className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                  {editAttendeeId ? "Save Changes" : "Add Participant"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>`;

const startIndex = content.indexOf(oldModalStart);
const endIndex = content.indexOf(oldModalEnd, startIndex);
if (startIndex !== -1 && endIndex !== -1) {
  content = content.substring(0, startIndex) + newModalJSX + content.substring(endIndex + oldModalEnd.length);
}

// 3. Update the attendee preview table to add the Edit button
const oldTableRow = `                                            <td className="p-2 border-b">{att.name || \`Attendee #\${idx}\`}</td>
                                            <td className="p-2 border-b">{att.email || "N/A"}</td>
                                            <td className="p-2 border-b">{att.councilNo || att.regNo || "N/A"}</td>
                                          </tr>`;

const newTableRow = `                                            <td className="p-2 border-b">{att.name || att.full_name || \`Attendee #\${idx}\`}</td>
                                            <td className="p-2 border-b">{att.email || "N/A"}</td>
                                            <td className="p-2 border-b">{att.councilNo || att.regNo || att.medical_council_reg_number || "N/A"}</td>
                                            <td className="p-2 border-b text-right">
                                              <button type="button" onClick={() => handleEditParticipantClick(att, idx)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 px-2 py-1 rounded">
                                                <FileEdit className="w-3.5 h-3.5" />
                                              </button>
                                            </td>
                                          </tr>`;

content = content.replace(oldTableRow, newTableRow);

const oldTableHeader = `                                            <th className="p-2 border-b">Attendee Name</th>
                                            <th className="p-2 border-b">Email</th>
                                            <th className="p-2 border-b">Council Reg No</th>
                                          </tr>`;

const newTableHeader = `                                            <th className="p-2 border-b">Attendee Name</th>
                                            <th className="p-2 border-b">Email</th>
                                            <th className="p-2 border-b">Council Reg No</th>
                                            <th className="p-2 border-b text-right">Actions</th>
                                          </tr>`;

content = content.replace(oldTableHeader, newTableHeader);

fs.writeFileSync(file, content, 'utf-8');
console.log('Successfully updated AdminCMS.tsx for full Event Registrations editing');
