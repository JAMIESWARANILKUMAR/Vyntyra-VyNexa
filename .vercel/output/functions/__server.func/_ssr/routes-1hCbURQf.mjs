import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { t as WorldClocks } from "./world-clocks-EszHW3xk.mjs";
import { I as Clock, N as Earth, O as FileText, R as CircleCheck, U as Check, V as ChevronRight, W as Building2, X as ArrowRight, _ as Mail, a as Trash2, b as LoaderCircle, d as Plus, f as Phone, g as MapPin, m as Menu, r as Upload, s as Shield, t as X, w as GraduationCap, x as Link, y as Lock } from "../_libs/lucide-react.mjs";
import { t as useServerFn } from "./useServerFn-CrZF2pjq.mjs";
import { t as supabase } from "./client-Fdjwgnl3.mjs";
import { n as Input, r as cn, t as Button } from "./input-wipxj9S9.mjs";
import { n as CheckboxIndicator, t as Checkbox$1 } from "../_libs/@radix-ui/react-checkbox+[...].mjs";
import { E as submitApplication, a as DialogHeader, b as listActiveJobPostings, c as Select, d as SelectTrigger, f as SelectValue, g as getApplicationsOpen, i as DialogFooter, l as SelectContent, n as DialogContent, o as DialogTitle, r as DialogDescription, s as InstallPwaButton, t as Dialog, u as SelectItem, y as incrementVisitorCount } from "./dialog-BrQ--iQm.mjs";
import { t as Textarea } from "./textarea-DClw33Hu.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Label } from "./label-CXxqgUVc.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-1hCbURQf.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var Checkbox = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Checkbox$1, {
	ref,
	className: cn("grid place-content-center peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground", className),
	...props,
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CheckboxIndicator, {
		className: cn("grid place-content-center text-current"),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-4 w-4" })
	})
}));
Checkbox.displayName = Checkbox$1.displayName;
var STATES = [
	"Andhra Pradesh",
	"Karnataka",
	"Uttar Pradesh"
];
var COLLEGES = {
	"Andhra Pradesh": [
		"IIT Tirupati",
		"IIIT Sri City",
		"NIT Andhra Pradesh (Tadepalligudem)",
		"IIIT Srikakulam (RGUKT)",
		"IIIT Nuzvid (RGUKT)",
		"IIIT R.K. Valley (RGUKT)",
		"IIIT Ongole (RGUKT)",
		"Andhra University College of Engineering, Visakhapatnam",
		"JNTU Kakinada",
		"JNTU Anantapur",
		"GITAM University, Visakhapatnam",
		"GITAM University, Bengaluru Campus",
		"VIT-AP University, Amaravati",
		"SRM University AP, Amaravati",
		"Vignan's Foundation for Science, Technology & Research, Guntur",
		"K L University (KLEF), Vaddeswaram",
		"Sri Venkateswara University College of Engineering, Tirupati",
		"Sree Vidyanikethan Engineering College, Tirupati",
		"Sri Sivani College of Engineering, Srikakulam",
		"Aditya Engineering College, Surampalem",
		"Aditya Institute of Technology and Management, Tekkali",
		"Anits (Anil Neerukonda Institute of Technology & Sciences), Visakhapatnam",
		"Gayatri Vidya Parishad College of Engineering, Visakhapatnam",
		"Gayatri Vidya Parishad College of Engineering for Women, Visakhapatnam",
		"Raghu Engineering College, Visakhapatnam",
		"Raghu Institute of Technology, Visakhapatnam",
		"MVGR College of Engineering, Vizianagaram",
		"GMR Institute of Technology, Rajam",
		"Lendi Institute of Engineering and Technology, Vizianagaram",
		"Sanketika Vidya Parishad Engineering College, Visakhapatnam",
		"Vignan's Institute of Information Technology, Visakhapatnam",
		"Sri Vasavi Engineering College, Tadepalligudem",
		"SRKR Engineering College, Bhimavaram",
		"BVC Engineering College, Odalarevu",
		"Godavari Institute of Engineering and Technology, Rajahmundry",
		"PVP Siddhartha Institute of Technology, Vijayawada",
		"VR Siddhartha Engineering College, Vijayawada",
		"Prasad V. Potluri Siddhartha Institute of Technology, Vijayawada",
		"Nannapaneni Venkat Rao College of Engineering, Tenali",
		"Lakireddy Bali Reddy College of Engineering, Mylavaram",
		"R.V.R. & J.C. College of Engineering, Guntur",
		"Bapatla Engineering College, Bapatla",
		"Chalapathi Institute of Engineering and Technology, Guntur",
		"QIS College of Engineering and Technology, Ongole",
		"PACE Institute of Technology & Sciences, Ongole",
		"Narasaraopeta Engineering College, Narasaraopet",
		"Vignan's Lara Institute of Technology & Science, Guntur",
		"Vasireddy Venkatadri Institute of Technology, Guntur",
		"Tirumala Engineering College, Narasaraopet",
		"Kallam Haranadhareddy Institute of Technology, Guntur",
		"Priyadarshini College of Engineering & Technology, Nellore",
		"Narayana Engineering College, Nellore",
		"Audisankara College of Engineering & Technology, Gudur",
		"Sri Venkateswara College of Engineering, Tirupati",
		"Sree Vidyanikethan Institute of Management, Tirupati",
		"Madanapalle Institute of Technology and Science, Madanapalle",
		"SVEC — Sri Venkateswara Engineering College, Suryapet",
		"SITAMS — Sreenivasa Institute of Technology and Management Studies, Chittoor",
		"SVCET — Sri Venkateswara College of Engineering and Technology, Chittoor",
		"AITS — Annamacharya Institute of Technology and Sciences, Rajampet",
		"AITS — Annamacharya Institute of Technology and Sciences, Tirupati",
		"GPREC — G. Pulla Reddy Engineering College, Kurnool",
		"RGMCET — Rajeev Gandhi Memorial College of Engineering and Technology, Nandyal",
		"KSRM College of Engineering, Kadapa",
		"Yogivemana University, Kadapa",
		"Sri Krishnadevaraya University College of Engineering & Technology, Anantapur",
		"JNTUA College of Engineering, Anantapur",
		"JNTUA College of Engineering, Pulivendula",
		"Sree Rama Engineering College, Tirupati",
		"Chadalawada Ramanamma Engineering College, Tirupati",
		"Malineni Lakshmaiah Women's Engineering College, Guntur",
		"St. Ann's College of Engineering and Technology, Chirala",
		"Ramachandra College of Engineering, Eluru",
		"Sasi Institute of Technology and Engineering, Tadepalligudem",
		"Swarnandhra College of Engineering and Technology, Narsapur",
		"Andhra Loyola Institute of Engineering and Technology, Vijayawada",
		"Nova College of Engineering and Technology, Vijayawada",
		"Amrita Sai Institute of Science and Technology, Paritala",
		"NRI Institute of Technology, Vijayawada",
		"NRI Institute of Technology & Sciences, Agiripalli",
		"Dhanekula Institute of Engineering & Technology, Vijayawada",
		"Usha Rama College of Engineering & Technology, Telaprolu",
		"Chirala Engineering College, Chirala",
		"Nimra College of Engineering and Technology, Vijayawada",
		"SISTAM — Sri Sivani Institute of Science, Technology and Management, Srikakulam",
		"Baba Institute of Technology and Sciences, Visakhapatnam",
		"Chaitanya Engineering College, Visakhapatnam",
		"Pydah College of Engineering, Visakhapatnam",
		"Avanthi Institute of Engineering and Technology, Visakhapatnam",
		"Sri Sarathi Institute of Engineering & Technology, Nuzvid",
		"Bapatla Women's Engineering College, Bapatla",
		"St. Peter's Engineering College, Vijayawada",
		"Other"
	],
	Karnataka: [
		"IIT Dharwad",
		"IIIT Dharwad",
		"IIIT Raichur",
		"NITK Surathkal (National Institute of Technology Karnataka)",
		"IISc Bangalore (Indian Institute of Science)",
		"IIM Bangalore",
		"R.V. College of Engineering, Bengaluru",
		"PES University, Bengaluru",
		"PES University, EC Campus",
		"M.S. Ramaiah Institute of Technology, Bengaluru",
		"BMS College of Engineering, Bengaluru",
		"BMS Institute of Technology & Management, Bengaluru",
		"Dayananda Sagar College of Engineering, Bengaluru",
		"Dayananda Sagar University, Bengaluru",
		"New Horizon College of Engineering, Bengaluru",
		"Sir M. Visvesvaraya Institute of Technology, Bengaluru",
		"JSS Academy of Technical Education, Bengaluru",
		"Nitte Meenakshi Institute of Technology, Bengaluru",
		"REVA University, Bengaluru",
		"Christ (Deemed to be University), Bengaluru",
		"CMR Institute of Technology, Bengaluru",
		"CMR University, Bengaluru",
		"Presidency University, Bengaluru",
		"Alliance University, Bengaluru",
		"Jain (Deemed-to-be University), Bengaluru",
		"The National Institute of Engineering (NIE), Mysuru",
		"Sri Jayachamarajendra College of Engineering (JSS Science and Technology University), Mysuru",
		"Vidyavardhaka College of Engineering, Mysuru",
		"GSSS Institute of Engineering & Technology for Women, Mysuru",
		"Vidya Vardhaka Sangha's Sri Siddhartha Institute of Technology, Tumakuru",
		"Siddaganga Institute of Technology, Tumakuru",
		"Sri Siddhartha Academy of Higher Education, Tumakuru",
		"Basaveshwar Engineering College, Bagalkot",
		"SDM College of Engineering & Technology, Dharwad",
		"KLE Technological University (BVBCET), Hubballi",
		"KLS Gogte Institute of Technology, Belagavi",
		"Jain College of Engineering, Belagavi",
		"Angadi Institute of Technology and Management, Belagavi",
		"Visvesvaraya Technological University, Belagavi",
		"PDA College of Engineering, Kalaburagi",
		"Poojya Doddappa Appa College of Engineering, Kalaburagi",
		"Sharnbasva University, Kalaburagi",
		"Ballari Institute of Technology and Management, Ballari",
		"Rao Bahadur Y. Mahabaleswarappa Engineering College, Ballari",
		"Sri Krishna Institute of Technology, Bengaluru",
		"Cambridge Institute of Technology, Bengaluru",
		"AMC Engineering College, Bengaluru",
		"Acharya Institute of Technology, Bengaluru",
		"Atria Institute of Technology, Bengaluru",
		"East Point College of Engineering and Technology, Bengaluru",
		"Global Academy of Technology, Bengaluru",
		"HKBK College of Engineering, Bengaluru",
		"Jyothy Institute of Technology, Bengaluru",
		"K.S. Institute of Technology, Bengaluru",
		"KLE Society's College of Engineering, Bengaluru",
		"Malnad College of Engineering, Hassan",
		"Manipal Institute of Technology, Manipal",
		"Manipal Academy of Higher Education, Manipal",
		"NMAM Institute of Technology, Nitte",
		"Nitte University, Mangaluru",
		"St. Joseph Engineering College, Mangaluru",
		"Sahyadri College of Engineering and Management, Mangaluru",
		"P.A. College of Engineering, Mangaluru",
		"Canara Engineering College, Mangaluru",
		"Mangalore Institute of Technology and Engineering, Moodabidri",
		"Bearys Institute of Technology, Mangaluru",
		"Yenepoya Institute of Technology, Moodbidri",
		"Alva's Institute of Engineering and Technology, Moodbidri",
		"Shri Madhwa Vadiraja Institute of Technology and Management, Bantakal",
		"GM Institute of Technology, Davangere",
		"Bapuji Institute of Engineering and Technology, Davangere",
		"S.J.M. Institute of Technology, Chitradurga",
		"Government Engineering College, Hassan",
		"Government Engineering College, Haveri",
		"Government Engineering College, Ramanagara",
		"Government Engineering College, Chamarajanagar",
		"University Visvesvaraya College of Engineering, Bengaluru",
		"Bangalore Institute of Technology, Bengaluru",
		"BNM Institute of Technology, Bengaluru",
		"M.V.J. College of Engineering, Bengaluru",
		"Sapthagiri College of Engineering, Bengaluru",
		"T. John Institute of Technology, Bengaluru",
		"The Oxford College of Engineering, Bengaluru",
		"Vemana Institute of Technology, Bengaluru",
		"SJB Institute of Technology, Bengaluru",
		"Nagarjuna College of Engineering and Technology, Bengaluru",
		"R.N.S. Institute of Technology, Bengaluru",
		"Reva Institute of Technology and Management, Bengaluru",
		"Adichunchanagiri Institute of Technology, Chikmagalur",
		"GITAM University, Bengaluru",
		"Amrita School of Engineering, Bengaluru",
		"Christ University Faculty of Engineering, Bengaluru",
		"Other"
	],
	"Uttar Pradesh": [
		"IIT Kanpur",
		"IIT (BHU) Varanasi",
		"IIIT Allahabad",
		"IIIT Lucknow",
		"MNNIT Allahabad",
		"Aligarh Muslim University, Zakir Hussain College of Engineering",
		"Harcourt Butler Technical University, Kanpur",
		"Institute of Engineering and Technology, Lucknow",
		"Madan Mohan Malaviya University of Technology, Gorakhpur",
		"Kamla Nehru Institute of Technology, Sultanpur",
		"Bundelkhand Institute of Engineering and Technology, Jhansi",
		"UPES — University of Petroleum and Energy Studies (Meerut Extension)",
		"Bennett University, Greater Noida",
		"Shiv Nadar University, Greater Noida",
		"Amity University, Noida",
		"Amity University, Lucknow",
		"Galgotias University, Greater Noida",
		"Galgotias College of Engineering and Technology, Greater Noida",
		"Sharda University, Greater Noida",
		"GL Bajaj Institute of Technology and Management, Greater Noida",
		"IEC Group of Institutions, Greater Noida",
		"IMS Engineering College, Ghaziabad",
		"Ajay Kumar Garg Engineering College, Ghaziabad",
		"ABES Engineering College, Ghaziabad",
		"ABES Institute of Technology, Ghaziabad",
		"Krishna Institute of Engineering and Technology (KIET), Ghaziabad",
		"IMS Ghaziabad — University Courses Campus",
		"Inderprastha Engineering College, Ghaziabad",
		"Raj Kumar Goel Institute of Technology, Ghaziabad",
		"Meerut Institute of Engineering and Technology, Meerut",
		"Meerut Institute of Technology, Meerut",
		"IIMT Group of Colleges, Meerut",
		"Subharti University, Meerut",
		"Bharat Institute of Technology, Meerut",
		"Noida Institute of Engineering and Technology (NIET), Greater Noida",
		"JSS Academy of Technical Education, Noida",
		"Jaypee Institute of Information Technology, Noida",
		"Jaypee University of Information Technology, Anoopshahr",
		"Bennett University School of Engineering, Greater Noida",
		"Delhi Technical Campus (Greater Noida)",
		"Lloyd Institute of Engineering and Technology, Greater Noida",
		"IIMT College of Engineering, Greater Noida",
		"Dr. A.P.J. Abdul Kalam Technical University, Lucknow (AKTU)",
		"Babu Banarasi Das University, Lucknow",
		"Integral University, Lucknow",
		"Shri Ramswaroop Memorial University, Lucknow",
		"Ambalika Institute of Management & Technology, Lucknow",
		"BBD National Institute of Technology & Management, Lucknow",
		"Goel Institute of Technology & Management, Lucknow",
		"Northern India Engineering College, Lucknow",
		"Rameshwaram Institute of Technology & Management, Lucknow",
		"SRMS College of Engineering and Technology, Bareilly",
		"Invertis University, Bareilly",
		"Rohilkhand Institute of Engineering & Technology, Bareilly",
		"Future Institute of Engineering and Technology, Bareilly",
		"Moradabad Institute of Technology, Moradabad",
		"Teerthanker Mahaveer University, Moradabad",
		"IFTM University, Moradabad",
		"College of Engineering Roorkee",
		"IIT Roorkee (Saharanpur Campus)",
		"Shobhit University, Saharanpur",
		"Feroze Gandhi Institute of Engineering & Technology, Raebareli",
		"Rajkiya Engineering College, Ambedkar Nagar",
		"Rajkiya Engineering College, Azamgarh",
		"Rajkiya Engineering College, Banda",
		"Rajkiya Engineering College, Bijnor",
		"Rajkiya Engineering College, Kannauj",
		"Rajkiya Engineering College, Mainpuri",
		"Rajkiya Engineering College, Mainpuri (RECM)",
		"Rajkiya Engineering College, Sonbhadra",
		"Pranveer Singh Institute of Technology, Kanpur",
		"Rama University, Kanpur",
		"University Institute of Engineering and Technology, CSJM University, Kanpur",
		"Naraina Vidya Peeth Engineering & Management Institute, Kanpur",
		"Axis Institute of Technology and Management, Kanpur",
		"PSIT College of Higher Education, Kanpur",
		"Allenhouse Institute of Technology, Kanpur",
		"United Institute of Technology, Allahabad",
		"Shambhunath Institute of Engineering and Technology, Allahabad",
		"United College of Engineering & Research, Allahabad",
		"Institute of Engineering and Rural Technology, Allahabad",
		"Sam Higginbottom University of Agriculture, Technology and Sciences, Allahabad",
		"Motilal Nehru National Institute of Technology (MNNIT), Allahabad",
		"Institute of Technology, Banaras Hindu University (now IIT BHU)",
		"GNIOT (Greater Noida Institute of Technology), Greater Noida",
		"Accurate Institute of Management & Technology, Greater Noida",
		"R.D. Engineering College, Ghaziabad",
		"IIMT University, Meerut",
		"College of Engineering & Rural Technology, Meerut",
		"Sanskriti University, Mathura",
		"GLA University, Mathura",
		"Hindustan College of Science and Technology, Mathura",
		"IIMT College of Engineering, Meerut",
		"Sri Ramswaroop Memorial College of Engineering & Management, Lucknow",
		"Kanpur Institute of Technology, Kanpur",
		"United Institute of Management, Allahabad",
		"Dr. Ambedkar Institute of Technology for Handicapped, Kanpur",
		"Uttar Pradesh Textile Technology Institute, Kanpur",
		"MJP Rohilkhand University, Bareilly",
		"Dr. Ram Manohar Lohia Avadh University, Ayodhya",
		"Chaudhary Charan Singh University, Meerut",
		"Other"
	]
};
function graduationYears() {
	const current = (/* @__PURE__ */ new Date()).getFullYear();
	const years = [];
	for (let y = 2022; y <= Math.max(current + 1, 2026); y++) years.push(y);
	return years;
}
var ROLES = [
	"Software Engineer — Search Infrastructure",
	"Machine Learning Engineer — Ranking",
	"Frontend Engineer",
	"Backend Engineer",
	"DevOps / SRE",
	"Data Engineer",
	"Product Designer",
	"Product Manager",
	"Marketing / Growth",
	"Business Development",
	"Internship — Engineering",
	"Internship — Research",
	"Other"
];
var EXPERIENCE = [
	"0-1 years",
	"1-3 years",
	"3-5 years",
	"5-8 years",
	"8+ years"
];
var AVAILABILITY = [
	"Immediately",
	"Within 15 days",
	"Within 30 days",
	"Within 60 days",
	"Flexible"
];
var MAX_SIZE = 5 * 1024 * 1024;
var ACCEPTED_EXT = /\.(pdf|docx?|rtf)$/i;
var ACCEPTED_MIME = /* @__PURE__ */ new Set([
	"application/pdf",
	"application/msword",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	"application/rtf",
	"text/rtf"
]);
function ApplicationPage() {
	const submit = useServerFn(submitApplication);
	const fetchOpen = useServerFn(getApplicationsOpen);
	const fetchJobs = useServerFn(listActiveJobPostings);
	const incrementVisit = useServerFn(incrementVisitorCount);
	const [submitting, setSubmitting] = (0, import_react.useState)(false);
	const [agreementOpen, setAgreementOpen] = (0, import_react.useState)(false);
	const [agreed, setAgreed] = (0, import_react.useState)(false);
	const [uploading, setUploading] = (0, import_react.useState)(false);
	const [resumePath, setResumePath] = (0, import_react.useState)("");
	const [resumeName, setResumeName] = (0, import_react.useState)("");
	const [resumeSize, setResumeSize] = (0, import_react.useState)(0);
	const [success, setSuccess] = (0, import_react.useState)(null);
	const [applicationsOpen, setApplicationsOpen] = (0, import_react.useState)(true);
	const [jobPostings, setJobPostings] = (0, import_react.useState)([]);
	const handleStateChange = (v) => {
		update("state")(v);
		setForm((s) => ({
			...s,
			college: ""
		}));
	};
	const handleAgreementChange = (v) => {
		setAgreed(v === true);
	};
	(0, import_react.useEffect)(() => {
		fetchOpen().then((r) => setApplicationsOpen(r.enabled)).catch(() => {});
		fetchJobs().then((r) => setJobPostings(r ?? [])).catch(() => {});
		incrementVisit().catch(() => {});
	}, [
		fetchOpen,
		fetchJobs,
		incrementVisit
	]);
	const [form, setForm] = (0, import_react.useState)({
		full_name: "",
		email: "",
		phone: "",
		role_applied: "",
		message: "",
		company: "",
		position: "",
		linkedin_url: "",
		years_experience: "",
		portfolio_url: "",
		availability: "",
		state: "",
		college: "",
		graduation_year: "",
		hod_name: "",
		hod_contact: "",
		hod_email: "",
		tp_officer_name: "",
		tp_officer_contact: "",
		tp_officer_email: "",
		job_posting_id: ""
	});
	const [projects, setProjects] = (0, import_react.useState)([]);
	const update = (k) => (v) => setForm((s) => ({
		...s,
		[k]: v
	}));
	function addProject() {
		if (projects.length >= 30) {
			toast.error("Maximum 30 projects");
			return;
		}
		setProjects((p) => [...p, {
			title: "",
			summary: "",
			project_url: "",
			document_path: "",
			document_name: ""
		}]);
	}
	function removeProject(i) {
		const p = projects[i];
		if (p?.document_path) supabase.storage.from("project-docs").remove([p.document_path]).catch(() => {});
		setProjects((s) => s.filter((_, idx) => idx !== i));
	}
	function updateProject(i, patch) {
		setProjects((s) => s.map((p, idx) => idx === i ? {
			...p,
			...patch
		} : p));
	}
	async function uploadProjectDoc(i, file) {
		if (!file) return;
		if (file.size > 10 * 1024 * 1024) {
			toast.error("Project document must be under 10 MB");
			return;
		}
		updateProject(i, { uploading: true });
		const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
		const path = `${(/* @__PURE__ */ new Date()).getFullYear()}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${safe}`;
		const { error } = await supabase.storage.from("project-docs").upload(path, file, {
			upsert: false,
			contentType: file.type || "application/octet-stream"
		});
		if (error) {
			toast.error("Upload failed: " + error.message);
			updateProject(i, { uploading: false });
			return;
		}
		updateProject(i, {
			document_path: path,
			document_name: file.name,
			uploading: false
		});
		toast.success("Project document uploaded");
	}
	async function handleResume(file) {
		if (!file) return;
		if (file.size > MAX_SIZE) {
			toast.error("Resume must be under 5 MB");
			return;
		}
		if (!ACCEPTED_EXT.test(file.name)) {
			toast.error("Only PDF, DOC, DOCX or RTF files are accepted");
			return;
		}
		if (file.type && !ACCEPTED_MIME.has(file.type) && !ACCEPTED_EXT.test(file.name)) {
			toast.error("Unsupported file type");
			return;
		}
		setUploading(true);
		const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
		const path = `${(/* @__PURE__ */ new Date()).getFullYear()}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${safe}`;
		const { error } = await supabase.storage.from("resumes").upload(path, file, {
			upsert: false,
			contentType: file.type || "application/octet-stream"
		});
		setUploading(false);
		if (error) {
			toast.error("Upload failed: " + error.message);
			return;
		}
		setResumePath(path);
		setResumeName(file.name);
		setResumeSize(file.size);
		toast.success("Resume uploaded securely");
	}
	function removeResume() {
		if (resumePath) supabase.storage.from("resumes").remove([resumePath]).catch(() => {});
		setResumePath("");
		setResumeName("");
		setResumeSize(0);
	}
	async function handleSubmit(e) {
		e.preventDefault();
		if (!agreed) {
			setAgreementOpen(true);
			return;
		}
		for (const k of [
			"full_name",
			"email",
			"phone",
			"role_applied"
		]) if (!form[k].trim()) {
			toast.error("Please complete all required fields");
			return;
		}
		for (const p of projects) if (!p.title.trim() || !p.summary.trim()) {
			toast.error("Each project needs a title and summary");
			return;
		}
		setSubmitting(true);
		try {
			const res = await submit({ data: {
				...form,
				graduation_year: form.graduation_year ? parseInt(form.graduation_year, 10) : null,
				resume_path: resumePath,
				job_posting_id: form.job_posting_id || null,
				projects: projects.map((p) => ({
					title: p.title,
					summary: p.summary,
					project_url: p.project_url,
					document_path: p.document_path
				})),
				agreement_accepted: true
			} });
			setSuccess(res.id);
			window.scrollTo({
				top: 0,
				behavior: "smooth"
			});
		} catch (err) {
			toast.error(err.message || "Submission failed");
		} finally {
			setSubmitting(false);
		}
	}
	if (success) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-background flex flex-col",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TopBar, { live: applicationsOpen }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex-1 flex items-center justify-center px-6 py-16",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "max-w-2xl w-full",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-md border border-border bg-card shadow-corp overflow-hidden",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "border-l-4 border-l-secondary bg-surface px-8 py-10 text-center",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-secondary/10",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, {
										className: "h-7 w-7 text-secondary",
										strokeWidth: 2
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
									className: "text-3xl font-semibold text-primary tracking-tight",
									children: "Application Received"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-3 text-muted-foreground max-w-lg mx-auto",
									children: [
										"Thank you for applying to ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-medium text-foreground",
											children: "Project VyNexa"
										}),
										". A confirmation has been dispatched to ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-medium text-foreground",
											children: form.email
										}),
										"."
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-6 inline-flex items-center gap-3 rounded-sm border border-border bg-background px-5 py-2.5 text-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-xs uppercase tracking-widest text-muted-foreground",
										children: "Reference ID"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-mono text-primary font-medium",
										children: success.slice(0, 8).toUpperCase()
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-6 text-xs text-muted-foreground",
									children: [
										"Our Talent Acquisition team will review your profile within ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-medium",
											children: "5–7 business days"
										}),
										"."
									]
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "px-8 py-5 bg-card border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
								href: "/track",
								className: "text-sm text-secondary font-medium hover:underline inline-flex items-center gap-1",
								children: ["Track application status ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "h-4 w-4" })]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
								href: "https://vyntyraconsultancyservices.in",
								target: "_blank",
								rel: "noreferrer",
								className: "text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1",
								children: ["Visit Vyntyra ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "h-4 w-4" })]
							})]
						})]
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Footer, {})
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UtilityBar, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TopBar, { live: applicationsOpen }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hero, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrustStrip, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto w-full max-w-6xl px-4 sm:px-6 pt-6 space-y-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WorldClocks, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OperationsStrip, {})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				id: "form",
				className: "mx-auto w-full max-w-6xl px-4 sm:px-6 pb-16 sm:pb-24",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid lg:grid-cols-[280px_1fr] gap-6 lg:gap-8",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("aside", {
						className: "hidden lg:block",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "sticky top-24 space-y-6",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-[10px] font-medium uppercase tracking-widest text-secondary mb-3",
								children: "Application Sections"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
								className: "space-y-1",
								children: [
									{
										n: "01",
										t: "Personal Information"
									},
									{
										n: "02",
										t: "Education & HOD Contacts"
									},
									{
										n: "03",
										t: "Professional Background"
									},
									{
										n: "04",
										t: "Portfolio & Resume"
									},
									{
										n: "05",
										t: "Recent Projects"
									},
									{
										n: "06",
										t: "Cover Message"
									},
									{
										n: "07",
										t: "Review & Submit"
									}
								].map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
									className: "flex items-start gap-3 py-2 border-l-2 border-border pl-3 hover:border-secondary transition-colors",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-mono text-[11px] text-muted-foreground mt-0.5",
										children: s.n
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-sm text-foreground",
										children: s.t
									})]
								}, s.n))
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-sm border border-border bg-surface p-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2 text-xs text-secondary font-medium mb-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "h-3.5 w-3.5" }), " Data Protection"]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-muted-foreground leading-relaxed",
									children: "All submissions are encrypted in transit and at rest. Resume files are stored in a private, access-controlled vault and are accessible only to authorised HR personnel."
								})]
							})]
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-md border border-border bg-card shadow-corp overflow-hidden",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "border-b border-border bg-surface px-5 sm:px-8 py-5 sm:py-6",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-1 w-10 bg-secondary rounded-full" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[11px] font-medium uppercase tracking-[0.2em] text-secondary",
										children: "Careers · Project VyNexa"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "mt-3 text-xl sm:text-2xl font-semibold text-primary tracking-tight",
									children: "Submit Your Application"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-1 text-sm text-muted-foreground",
									children: [
										"Fields marked with ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-destructive",
											children: "*"
										}),
										" are required. Estimated time: 6–8 minutes."
									]
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
							onSubmit: handleSubmit,
							className: "px-4 sm:px-8 py-6 sm:py-8 space-y-8 sm:space-y-10",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Section, {
									title: "Personal Information",
									step: "01",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid md:grid-cols-2 gap-5",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
												label: "Full name",
												required: true,
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													value: form.full_name,
													onChange: (e) => update("full_name")(e.target.value),
													placeholder: "John Doe"
												})
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
												label: "Email address",
												required: true,
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													type: "email",
													value: form.email,
													onChange: (e) => update("email")(e.target.value),
													placeholder: "you@example.com"
												})
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
												label: "Phone number",
												required: true,
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													value: form.phone,
													onChange: (e) => update("phone")(e.target.value),
													placeholder: "+91 98765 43210"
												})
											}),
											jobPostings.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
												label: "Job Opening",
												required: true,
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
													value: form.job_posting_id,
													onValueChange: (v) => {
														update("job_posting_id")(v);
														const job = jobPostings.find((j) => j.id === v);
														if (job) update("role_applied")(job.title);
													},
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Select a job opening" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: jobPostings.map((j) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
														value: j.id,
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "flex flex-col",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: j.title }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																className: "text-xs text-muted-foreground",
																children: [
																	j.department,
																	" · ",
																	j.location,
																	" · ",
																	j.type
																]
															})]
														})
													}, j.id)) })]
												})
											}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
												label: "Role you're applying for",
												required: true,
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
													value: form.role_applied,
													onValueChange: update("role_applied"),
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Select a role" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: ROLES.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
														value: r,
														children: r
													}, r)) })]
												})
											})
										]
									}), jobPostings.length > 0 && form.job_posting_id && (() => {
										const selJob = jobPostings.find((j) => j.id === form.job_posting_id);
										if (!selJob) return null;
										return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "mt-4 rounded-sm border border-secondary/30 bg-secondary/5 p-4",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "text-[11px] uppercase tracking-widest text-secondary font-medium mb-2",
													children: "Selected Position Details"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "text-sm font-medium text-foreground",
													children: selJob.title
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "text-xs text-muted-foreground mt-1",
													children: [
														selJob.department,
														" · ",
														selJob.location,
														" · ",
														selJob.type
													]
												}),
												selJob.description && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-sm text-muted-foreground mt-2 leading-relaxed whitespace-pre-wrap line-clamp-4",
													children: selJob.description
												}),
												selJob.requirements && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "mt-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "text-[10px] uppercase tracking-widest text-muted-foreground font-medium",
														children: "Requirements"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "text-sm text-muted-foreground mt-1 whitespace-pre-wrap line-clamp-3",
														children: selJob.requirements
													})]
												})
											]
										});
									})()]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
									title: "Education & Department Contacts",
									step: "02",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid md:grid-cols-2 gap-5",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
												label: "State",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
													value: form.state,
													onValueChange: handleStateChange,
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Select state" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: STATES.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
														value: r,
														children: r
													}, r)) })]
												})
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
												label: "College / Institution",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
													value: form.college,
													onValueChange: update("college"),
													disabled: !form.state,
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: form.state ? "Select college" : "Select state first" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, {
														className: "max-h-72",
														children: (form.state ? COLLEGES[form.state] : []).map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
															value: c,
															children: c
														}, c))
													})]
												})
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
												label: "Graduation year",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
													value: form.graduation_year,
													onValueChange: update("graduation_year"),
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Select year" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: graduationYears().map((y) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
														value: String(y),
														children: y
													}, y)) })]
												})
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
												label: "HOD name",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													value: form.hod_name,
													onChange: (e) => update("hod_name")(e.target.value),
													placeholder: "Dr. …"
												})
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
												label: "HOD contact",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													value: form.hod_contact,
													onChange: (e) => update("hod_contact")(e.target.value),
													placeholder: "+91 …"
												})
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
												label: "HOD email",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													type: "email",
													value: form.hod_email,
													onChange: (e) => update("hod_email")(e.target.value),
													placeholder: "hod@college.edu"
												})
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "md:col-span-2 grid md:grid-cols-3 gap-5 pt-3 mt-2 border-t border-border",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "md:col-span-3 text-[11px] uppercase tracking-widest text-muted-foreground font-medium flex items-center gap-2",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GraduationCap, { className: "h-3.5 w-3.5" }), " Training & Placement (optional)"]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
														label: "T&P officer name",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
															value: form.tp_officer_name,
															onChange: (e) => update("tp_officer_name")(e.target.value),
															placeholder: "Prof. …"
														})
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
														label: "T&P officer contact",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
															value: form.tp_officer_contact,
															onChange: (e) => update("tp_officer_contact")(e.target.value),
															placeholder: "+91 …"
														})
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
														label: "T&P officer email",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
															type: "email",
															value: form.tp_officer_email,
															onChange: (e) => update("tp_officer_email")(e.target.value),
															placeholder: "tpo@college.edu"
														})
													})
												]
											})
										]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
									title: "Professional Background",
									step: "03",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid md:grid-cols-2 gap-5",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
												label: "Current company",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													value: form.company,
													onChange: (e) => update("company")(e.target.value),
													placeholder: "Acme Corp"
												})
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
												label: "Current position",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													value: form.position,
													onChange: (e) => update("position")(e.target.value),
													placeholder: "Senior Engineer"
												})
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
												label: "Years of experience",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
													value: form.years_experience,
													onValueChange: update("years_experience"),
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Select range" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: EXPERIENCE.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
														value: r,
														children: r
													}, r)) })]
												})
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
												label: "LinkedIn profile",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "relative",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														className: "pl-9",
														value: form.linkedin_url,
														onChange: (e) => update("linkedin_url")(e.target.value),
														placeholder: "https://linkedin.com/in/…"
													})]
												})
											})
										]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
									title: "Portfolio & Resume",
									step: "04",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid md:grid-cols-2 gap-5",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
												label: "Portfolio / GitHub URL",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "relative",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														className: "pl-9",
														value: form.portfolio_url,
														onChange: (e) => update("portfolio_url")(e.target.value),
														placeholder: "https://github.com/…"
													})]
												})
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
												label: "Availability to join",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
													value: form.availability,
													onValueChange: update("availability"),
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Select availability" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: AVAILABILITY.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
														value: r,
														children: r
													}, r)) })]
												})
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
												label: "Resume / CV — PDF, DOC, DOCX or RTF (max 5 MB)",
												className: "md:col-span-2",
												children: resumeName ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center justify-between gap-3 rounded-sm border border-secondary/40 bg-secondary/5 px-4 py-3",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex items-center gap-3 min-w-0",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
															className: "h-9 w-9 flex-shrink-0 rounded-sm bg-secondary/10 flex items-center justify-center",
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "h-5 w-5 text-secondary" })
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "min-w-0",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
																className: "text-sm font-medium text-foreground truncate",
																children: resumeName
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "text-xs text-muted-foreground",
																children: [(resumeSize / 1024).toFixed(0), " KB · uploaded securely"]
															})]
														})]
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
														type: "button",
														onClick: removeResume,
														className: "text-muted-foreground hover:text-destructive p-1",
														"aria-label": "Remove resume",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-4 w-4" })
													})]
												}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
													className: "flex items-center gap-4 rounded-sm border-2 border-dashed border-border bg-surface px-5 py-6 cursor-pointer hover:border-secondary hover:bg-secondary/5 transition-colors",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
															className: "h-10 w-10 rounded-sm bg-secondary/10 flex items-center justify-center",
															children: uploading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-5 w-5 text-secondary animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { className: "h-5 w-5 text-secondary" })
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "flex-1",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
																className: "text-sm font-medium text-foreground",
																children: uploading ? "Uploading securely…" : "Click to upload your resume"
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
																className: "text-xs text-muted-foreground mt-0.5",
																children: "PDF, DOC, DOCX, RTF · 5 MB maximum · Encrypted & confidential"
															})]
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
															type: "file",
															className: "hidden",
															accept: ".pdf,.doc,.docx,.rtf,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/rtf",
															onChange: (e) => handleResume(e.target.files?.[0] ?? null),
															disabled: uploading
														})
													]
												})
											})
										]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
									title: "Recent Projects (optional)",
									step: "05",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-4",
										children: [
											projects.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-sm text-muted-foreground",
												children: "Add any relevant academic, personal, or professional projects. You can include a URL, document, and summary."
											}),
											projects.map((p, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "rounded-sm border border-border bg-surface p-4 space-y-3",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center justify-between",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "text-[11px] uppercase tracking-widest text-secondary font-medium",
														children: ["Project ", i + 1]
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
														type: "button",
														onClick: () => removeProject(i),
														className: "text-muted-foreground hover:text-destructive p-1",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-4 w-4" })
													})]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "grid md:grid-cols-2 gap-4",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
															label: "Project title",
															required: true,
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
																value: p.title,
																onChange: (e) => updateProject(i, { title: e.target.value }),
																placeholder: "e.g. Distributed Search Prototype"
															})
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
															label: "Project URL",
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
																value: p.project_url,
																onChange: (e) => updateProject(i, { project_url: e.target.value }),
																placeholder: "https://…"
															})
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
															label: "Summary",
															required: true,
															className: "md:col-span-2",
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
																rows: 3,
																value: p.summary,
																onChange: (e) => updateProject(i, { summary: e.target.value }),
																placeholder: "Problem, approach, your role, outcome…"
															})
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
															label: "Document (PDF/DOC/ZIP, max 10 MB)",
															className: "md:col-span-2",
															children: p.document_name ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "flex items-center justify-between rounded-sm border border-secondary/40 bg-secondary/5 px-3 py-2 text-sm",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																	className: "flex items-center gap-2 min-w-0",
																	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "h-4 w-4 text-secondary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																		className: "truncate",
																		children: p.document_name
																	})]
																}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
																	type: "button",
																	onClick: () => updateProject(i, {
																		document_path: "",
																		document_name: ""
																	}),
																	className: "text-muted-foreground hover:text-destructive p-1",
																	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-3.5 w-3.5" })
																})]
															}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
																className: "flex items-center gap-3 rounded-sm border border-dashed border-border bg-background px-3 py-2 cursor-pointer hover:border-secondary text-sm text-muted-foreground",
																children: [
																	p.uploading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin text-secondary" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { className: "h-4 w-4 text-secondary" }),
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: p.uploading ? "Uploading…" : "Attach project document" }),
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
																		type: "file",
																		className: "hidden",
																		onChange: (e) => uploadProjectDoc(i, e.target.files?.[0] ?? null),
																		disabled: p.uploading
																	})
																]
															})
														})
													]
												})]
											}, i)),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
												type: "button",
												variant: "outline",
												onClick: addProject,
												className: "w-full",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "h-4 w-4 mr-2" }),
													" Add project ",
													projects.length > 0 && `(${projects.length}/30)`
												]
											})
										]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
									title: "Cover Message",
									step: "06",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
										label: "Why do you want to join Project VyNexa?",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
											rows: 5,
											value: form.message,
											onChange: (e) => update("message")(e.target.value),
											placeholder: "Tell us briefly about your motivation, relevant experience, and what you'd bring to the team…"
										})
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: `rounded-sm border p-5 ${agreed ? "border-secondary/40 bg-secondary/5" : "border-border bg-surface"}`,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-start gap-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Checkbox, {
											id: "agreement",
											checked: agreed,
											onCheckedChange: handleAgreementChange,
											className: "mt-0.5"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
											htmlFor: "agreement",
											className: "text-sm text-foreground leading-relaxed cursor-pointer select-none",
											children: [
												"I confirm I have read and agree to the",
												" ",
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
													href: "/terms",
													target: "_blank",
													rel: "noreferrer",
													className: "text-secondary font-medium underline underline-offset-4 hover:text-primary",
													children: "Applicant Terms"
												}),
												" ",
												"and",
												" ",
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
													href: "/privacy",
													target: "_blank",
													rel: "noreferrer",
													className: "text-secondary font-medium underline underline-offset-4 hover:text-primary",
													children: "Privacy Notice & Data Handling Policy"
												}),
												". I confirm all information provided is accurate to the best of my knowledge.",
												" ",
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
													type: "button",
													onClick: () => setAgreementOpen(true),
													className: "text-muted-foreground underline underline-offset-4 hover:text-primary",
													children: "View full summary"
												})
											]
										})]
									}), !agreed && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-3 pl-7 text-[11px] text-muted-foreground",
										children: "Submission is disabled until you confirm the agreement above."
									})]
								}),
								!applicationsOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "rounded-sm border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900",
									children: "Applications are currently paused. Please check back soon or track existing applications via the portal."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2 border-t border-border",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-xs text-muted-foreground flex items-center gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shield, { className: "h-3.5 w-3.5 text-secondary" }), " Secure submission · TLS 1.3 · ISO-aligned data handling"]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										type: "submit",
										size: "lg",
										disabled: submitting || !agreed || !applicationsOpen,
										className: "bg-primary hover:bg-secondary text-primary-foreground min-w-[220px] font-medium",
										children: submitting ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }), " Submitting…"] }) : !applicationsOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: "Applications Paused" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: ["Submit Application ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "ml-2 h-4 w-4" })] })
									})]
								})
							]
						})]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Footer, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AgreementDialog, {
				open: agreementOpen,
				onOpenChange: setAgreementOpen,
				onAccept: () => {
					setAgreed(true);
					setAgreementOpen(false);
				}
			})
		]
	});
}
function UtilityBar() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "border-b border-border bg-primary text-primary-foreground/80 text-[11px] sm:text-xs",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto w-full max-w-6xl px-3 sm:px-6 h-8 sm:h-9 flex items-center justify-between gap-2 sm:gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2 sm:gap-4 min-w-0 flex-1",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "inline-flex items-center gap-1 sm:gap-1.5 shrink-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Earth, { className: "h-3 w-3 shrink-0" }), " IN · Global"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "opacity-40 hidden xs:inline sm:inline",
						children: "|"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
						href: "mailto:hr@vyntyraconsultancyservices.in",
						className: "inline-flex items-center gap-1 sm:gap-1.5 truncate hover:text-gold min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mail, { className: "h-3 w-3 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "truncate",
							children: "hr@vyntyraconsultancyservices.in"
						})]
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2 sm:gap-4 ml-auto shrink-0",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "https://vyntyraconsultancyservices.in",
						target: "_blank",
						rel: "noreferrer",
						className: "hover:text-gold hidden sm:inline",
						children: "Vyntyra.in"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "opacity-40 hidden sm:inline",
						children: "|"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "/status",
						className: "hover:text-gold",
						children: "Track"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "opacity-40",
						children: "|"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "/auth",
						className: "hover:text-gold",
						children: "Employee"
					})
				]
			})]
		})
	});
}
var APPLY_PHRASES = ["Apply Now", "Interested to work on VyNexa"];
function AnimatedApplyText({ className = "" }) {
	const [idx, setIdx] = (0, import_react.useState)(0);
	(0, import_react.useEffect)(() => {
		let timeoutId = null;
		const schedule = () => {
			if (typeof document !== "undefined" && document.hidden) return;
			timeoutId = setTimeout(() => {
				setIdx((i) => (i + 1) % APPLY_PHRASES.length);
				schedule();
			}, 3e4);
		};
		const clear = () => {
			if (timeoutId) {
				clearTimeout(timeoutId);
				timeoutId = null;
			}
		};
		const onVisibility = () => {
			clear();
			if (!document.hidden) schedule();
		};
		schedule();
		document.addEventListener("visibilitychange", onVisibility);
		return () => {
			clear();
			document.removeEventListener("visibilitychange", onVisibility);
		};
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "relative inline-block " + className,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "inline-block animate-fade-in whitespace-nowrap",
			children: APPLY_PHRASES[idx]
		}, idx)
	});
}
function TopBar({ live = true }) {
	const [menuOpen, setMenuOpen] = (0, import_react.useState)(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
		className: "border-b border-border bg-card sticky top-0 z-40 backdrop-blur",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto w-full max-w-6xl px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
				href: "/",
				className: "flex items-center gap-3 min-w-0 shrink",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: "/favicon.png",
					alt: "Vyntyra Consultancy Services",
					className: "h-8 sm:h-11 w-auto shrink-0"
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2 sm:gap-3 shrink-0",
				children: [
					live ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "hidden sm:inline-flex items-center gap-1.5 rounded-sm border border-destructive/30 bg-destructive/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-destructive",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "relative flex h-2 w-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "relative inline-flex h-2 w-2 rounded-full bg-destructive" })]
						}), "Live · Accepting Applications"]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "hidden sm:inline-flex items-center gap-1.5 rounded-sm border border-border bg-surface px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-2 w-2 rounded-full bg-muted-foreground/60" }), "Applications Paused"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InstallPwaButton, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
						className: "hidden md:flex items-center gap-1 text-sm",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								href: "/about",
								className: "px-3 py-2 text-muted-foreground hover:text-primary hover:bg-surface rounded-sm",
								children: "About"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								href: "#form",
								className: "px-3 py-2 text-muted-foreground hover:text-primary hover:bg-surface rounded-sm",
								children: "Careers"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								href: "/status",
								className: "px-3 py-2 text-muted-foreground hover:text-primary hover:bg-surface rounded-sm",
								children: "Track Status"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-px h-5 bg-border mx-2" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
								href: "#form",
								className: "group relative inline-flex items-center gap-1.5 bg-primary hover:bg-secondary text-primary-foreground px-4 py-2 rounded-sm text-sm font-medium transition-colors overflow-hidden",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatedApplyText, {}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" })
								]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
						href: "#form",
						onClick: (e) => {
							if (menuOpen) {
								e.preventDefault();
								setMenuOpen(false);
								setTimeout(() => {
									const el = document.getElementById("form");
									if (el) el.scrollIntoView({
										behavior: "smooth",
										block: "start"
									});
									else window.location.hash = "form";
								}, 320);
							}
						},
						className: "group relative md:hidden inline-flex items-center gap-1 bg-primary hover:bg-secondary text-primary-foreground px-3 py-1.5 rounded-sm text-xs font-medium overflow-hidden max-w-[62vw]",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "pointer-events-none absolute inset-0 -translate-x-full group-active:translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatedApplyText, { className: "truncate" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "h-3 w-3 shrink-0" })
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"aria-label": menuOpen ? "Close menu" : "Open menu",
						"aria-expanded": menuOpen,
						onClick: () => setMenuOpen((v) => !v),
						className: "md:hidden inline-flex items-center justify-center h-9 w-9 rounded-sm border border-border text-primary hover:bg-surface transition-colors",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "relative h-5 w-5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, { className: `absolute inset-0 h-5 w-5 transition-all duration-300 ${menuOpen ? "rotate-90 opacity-0 scale-75" : "rotate-0 opacity-100 scale-100"}` }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: `absolute inset-0 h-5 w-5 transition-all duration-300 ${menuOpen ? "rotate-0 opacity-100 scale-100" : "-rotate-90 opacity-0 scale-75"}` })]
						})
					})
				]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: `md:hidden overflow-hidden transition-all duration-300 ease-in-out ${menuOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "border-t border-border bg-card",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto w-full max-w-6xl px-4 sm:px-6 py-3 flex flex-col text-sm",
					children: [
						live ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "sm:hidden inline-flex items-center gap-1.5 self-start rounded-sm border border-destructive/30 bg-destructive/10 px-2 py-1 mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-destructive",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "relative flex h-2 w-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "relative inline-flex h-2 w-2 rounded-full bg-destructive" })]
							}), "Live · Accepting Applications"]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "sm:hidden inline-flex items-center gap-1.5 self-start rounded-sm border border-border bg-surface px-2 py-1 mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-2 w-2 rounded-full bg-muted-foreground/60" }), "Applications Paused"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: "/about",
							onClick: () => setMenuOpen(false),
							className: "px-2 py-2.5 border-b border-border text-primary hover:bg-surface rounded-sm transition-colors",
							children: "About"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: "#form",
							onClick: () => setMenuOpen(false),
							className: "px-2 py-2.5 border-b border-border text-primary hover:bg-surface rounded-sm transition-colors",
							children: "Careers"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: "/status",
							onClick: () => setMenuOpen(false),
							className: "px-2 py-2.5 border-b border-border text-primary hover:bg-surface rounded-sm transition-colors",
							children: "Track Status"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: "/auth",
							onClick: () => setMenuOpen(false),
							className: "px-2 py-2.5 text-muted-foreground hover:text-primary hover:bg-surface rounded-sm transition-colors",
							children: "Employee Sign-in"
						})
					]
				})
			})
		})]
	});
}
function Hero() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "relative overflow-hidden bg-gradient-hero text-primary-foreground",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 corporate-grid" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-gold/10 to-transparent hidden lg:block" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "relative mx-auto w-full max-w-6xl px-4 sm:px-6 py-14 sm:py-20 lg:py-28",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid lg:grid-cols-[1.5fr_1fr] gap-8 lg:gap-10 items-center",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "inline-flex items-center gap-2 rounded-sm border border-gold/40 bg-gold/10 px-3 py-1 text-[11px] font-medium text-gold uppercase tracking-[0.18em]",
							children: "Now Hiring · Founding Team"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
							className: "mt-5 sm:mt-6 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold leading-[1.1] tracking-tight",
							children: [
								"Build the next generation of",
								" ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-gold",
									children: "intelligent search."
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-6 text-base lg:text-lg text-primary-foreground/75 max-w-2xl leading-relaxed",
							children: [
								"Vyntyra Consultancy Services is assembling a founding team for ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-primary-foreground font-medium",
									children: "Project VyNexa"
								}),
								" — a private, intelligent search engine designed for how people actually find things today. Apply securely through our corporate careers portal."
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-8 flex flex-wrap gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
								href: "#form",
								className: "inline-flex items-center gap-2 bg-gold hover:bg-gold/90 text-gold-foreground px-6 py-3 rounded-full text-sm font-semibold transition-colors shadow-lg shadow-gold/20",
								children: ["Apply Now ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "h-4 w-4" })]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								href: "/about",
								className: "inline-flex items-center gap-2 border border-primary-foreground/30 hover:bg-primary-foreground/10 text-primary-foreground px-6 py-3 rounded-full text-sm font-medium transition-colors",
								children: "About Vyntyra"
							})]
						})
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "hidden lg:block",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-sm border border-primary-foreground/15 bg-primary-foreground/[0.04] backdrop-blur p-6",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-[10px] font-medium uppercase tracking-[0.2em] text-gold mb-4",
								children: "At a Glance"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
								className: "space-y-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "pb-3 border-b border-primary-foreground/10",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
											className: "text-xs uppercase tracking-wider text-primary-foreground/60 mb-1.5",
											children: "Locations"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dd", {
											className: "text-sm font-medium leading-relaxed",
											children: ["India — Visakhapatnam, Bengaluru, Hyderabad, Uttar Pradesh", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-primary-foreground/60",
												children: " · Remote"
											})]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex justify-between items-baseline pb-3 border-b border-primary-foreground/10",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
											className: "text-xs uppercase tracking-wider text-primary-foreground/60",
											children: "Response Time"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
											className: "text-2xl font-semibold",
											children: "5–7 days"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
										className: "text-xs uppercase tracking-wider text-primary-foreground/60 mb-1.5",
										children: "Data Handling"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dd", {
										className: "text-sm font-medium leading-relaxed",
										children: ["Secured by Cloudflare Technologies", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "block text-primary-foreground/70 mt-1",
											children: "ISO-aligned · NASSCOM Verified · Registered under MSME"
										})]
									})] })
								]
							})]
						})
					})]
				})
			})
		]
	});
}
function TrustStrip() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		className: "border-b border-border bg-card",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mx-auto w-full max-w-6xl px-4 sm:px-6 py-6 sm:py-8 grid grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6",
			children: [
				{
					icon: Shield,
					label: "Confidential Process",
					value: "Your application is visible only to authorised HR personnel."
				},
				{
					icon: Lock,
					label: "Encrypted at Rest",
					value: "TLS 1.3 in transit; encrypted vault for resumes."
				},
				{
					icon: Building2,
					label: "Merit-Based Review",
					value: "Equal-opportunity evaluation, transparent workflow."
				},
				{
					icon: CircleCheck,
					label: "Trackable Status",
					value: "Automated email updates at every stage."
				}
			].map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "h-9 w-9 flex-shrink-0 rounded-sm bg-secondary/10 flex items-center justify-center",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(i.icon, {
						className: "h-4.5 w-4.5 text-secondary",
						strokeWidth: 2
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-sm font-medium text-primary",
					children: i.label
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-xs text-muted-foreground mt-0.5 leading-relaxed",
					children: i.value
				})] })]
			}, i.label))
		})
	});
}
function OperationsStrip() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "rounded-md border border-border bg-card",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border",
			children: [
				{
					icon: MapPin,
					label: "Locations",
					value: "India · Visakhapatnam · Bengaluru · Hyderabad · Uttar Pradesh · Remote"
				},
				{
					icon: Clock,
					label: "Response Time",
					value: "5–7 business days"
				},
				{
					icon: Shield,
					label: "Data Handling",
					value: "Secured by Cloudflare · ISO-aligned · NASSCOM Verified · MSME Registered"
				}
			].map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0 rounded-sm bg-secondary/10 flex items-center justify-center",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(i.icon, { className: "h-3.5 w-3.5 sm:h-4 sm:w-4 text-secondary" })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0 flex-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[9px] sm:text-[10px] uppercase tracking-[0.16em] sm:tracking-[0.18em] text-secondary font-semibold",
						children: i.label
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[12px] sm:text-sm text-foreground mt-0.5 leading-snug break-words",
						children: i.value
					})]
				})]
			}, i.label))
		})
	});
}
function Section({ title, step, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-3 mb-5 pb-3 border-b border-border",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "inline-flex items-center justify-center h-7 w-7 rounded-sm bg-primary text-primary-foreground text-[11px] font-semibold font-mono",
			children: step
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
			className: "text-base font-semibold text-primary tracking-tight",
			children: title
		})]
	}), children] });
}
function Field({ label, required, children, className = "" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-1.5 " + className,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Label, {
			className: "text-xs font-medium text-foreground/80",
			children: [
				label,
				" ",
				required && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-destructive",
					children: "*"
				})
			]
		}), children]
	});
}
function Footer() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("footer", {
		className: "bg-primary text-primary-foreground",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto w-full max-w-6xl px-4 sm:px-6 py-10 sm:py-12",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid md:grid-cols-4 gap-8",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "md:col-span-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3 mb-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "bg-white rounded-sm p-2",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: "/favicon.png",
									alt: "Vyntyra",
									className: "h-10 w-auto"
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "font-semibold text-lg leading-tight",
								children: "Vyntyra Consultancy Services"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-[10px] uppercase tracking-[0.18em] text-primary-foreground/60 mt-0.5",
								children: "Building Project VyNexa"
							})] })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-primary-foreground/70 leading-relaxed max-w-md",
							children: "A technology consultancy engineering the next generation of intelligent search infrastructure. Our team spans engineering, research, product and enterprise delivery."
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[11px] uppercase tracking-[0.18em] text-gold font-medium mb-3",
						children: "Company"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
						className: "space-y-2 text-sm text-primary-foreground/70",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								href: "https://vyntyraconsultancyservices.in",
								target: "_blank",
								rel: "noreferrer",
								className: "hover:text-gold",
								children: "About Vyntyra"
							}) }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								href: "#form",
								className: "hover:text-gold",
								children: "Careers"
							}) }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								href: "/status",
								className: "hover:text-gold",
								children: "Track Application"
							}) }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								href: "/auth",
								className: "hover:text-gold",
								children: "Employee Portal"
							}) })
						]
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[11px] uppercase tracking-[0.18em] text-gold font-medium mb-3",
						children: "Contact"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
						className: "space-y-2 text-sm text-primary-foreground/70",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex items-start gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mail, { className: "h-4 w-4 mt-0.5 text-gold/70" }), " hr@vyntyraconsultancyservices.in"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex items-start gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, { className: "h-4 w-4 mt-0.5 text-gold/70" }), " Contact via website"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex items-start gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "h-4 w-4 mt-0.5 text-gold/70" }), " India · Global Delivery"]
							})
						]
					})] })
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-10 pt-6 border-t border-primary-foreground/10 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-primary-foreground/50",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					"© ",
					(/* @__PURE__ */ new Date()).getFullYear(),
					" Vyntyra Consultancy Services. All rights reserved."
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: "/privacy",
							className: "hover:text-gold",
							children: "Privacy Notice"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: "/terms",
							className: "hover:text-gold",
							children: "Applicant Terms"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: "/about",
							className: "hover:text-gold",
							children: "About"
						})
					]
				})]
			})]
		})
	});
}
function AgreementDialog({ open, onOpenChange, onAccept }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "max-w-2xl max-h-[85vh] overflow-y-auto",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
					className: "text-2xl text-primary tracking-tight",
					children: "Applicant Agreement"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Please read the terms below before submitting your application." })] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "space-y-4 text-sm text-foreground leading-relaxed",
					children: [
						["Accuracy of Information", "You confirm that all information provided in this application, including personal details, employment history, and uploaded documents, is true, complete, and accurate to the best of your knowledge. Any misrepresentation may lead to disqualification."],
						["Data Collection & Purpose", "Vyntyra Consultancy Services collects the information you submit solely for the purpose of evaluating your candidacy for Project VyNexa. Data is stored securely on encrypted infrastructure and access is restricted to authorised talent-acquisition personnel."],
						["Data Retention", "Application data is retained for up to 24 months to consider you for future openings unless you request earlier deletion by writing to hr@vyntyraconsultancyservices.in."],
						["Confidentiality", "Any information regarding Project VyNexa disclosed during the recruitment process (interviews, assignments, technical discussions) is confidential and shall not be shared with third parties."],
						["Non-Discrimination", "Vyntyra is an equal-opportunity employer. Applications are evaluated on merit, without regard to race, gender, religion, age, disability, or any protected characteristic."],
						["Your Rights", "You have the right to access, correct, or request deletion of your personal data. Contact our data-protection team at hr@vyntyraconsultancyservices.in for any privacy requests."],
						["Communication", "By submitting, you consent to receive application-status emails at the address provided. You will not receive marketing communications."]
					].map(([h, p], i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h4", {
						className: "font-semibold text-primary mb-1",
						children: [
							i + 1,
							". ",
							h
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-muted-foreground",
						children: p
					})] }, h))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
					className: "gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						onClick: () => onOpenChange(false),
						children: "Cancel"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "bg-primary hover:bg-secondary",
						onClick: onAccept,
						children: "I Agree & Continue"
					})]
				})
			]
		})
	});
}
//#endregion
export { ApplicationPage as component };
