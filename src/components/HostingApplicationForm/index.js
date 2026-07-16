import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import cn from "classnames";
import styles from "./HostingApplicationForm.module.sass";
import Icon from "../Icon";
import { getBusinessInterests, requestHostingOtp, verifyHostingOtp, resendHostingOtp } from "../../utils/api";

const GOOGLE_MAPS_SCRIPT_ID = "google-maps-places-script";
const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

const INDIA_STATE_DISTRICTS = {
  "Andaman and Nicobar Islands": ["Nicobar", "North and Middle Andaman", "South Andaman"],
  "Andhra Pradesh": ["Alluri Sitharama Raju", "Anakapalli", "Anantapur", "Annamayya", "Bapatla", "Chittoor", "Dr. B. R. Ambedkar Konaseema", "East Godavari", "Eluru", "Guntur", "Kakinada", "Krishna", "Kurnool", "Nandyal", "NTR", "Palnadu", "Parvathipuram Manyam", "Prakasam", "Sri Potti Sriramulu Nellore", "Sri Sathya Sai", "Srikakulam", "Tirupati", "Visakhapatnam", "Vizianagaram", "West Godavari", "YSR Kadapa"],
  "Arunachal Pradesh": ["Anjaw", "Bichom", "Changlang", "Dibang Valley", "East Kameng", "East Siang", "Kamle", "Kra Daadi", "Kurung Kumey", "Leparada", "Lohit", "Longding", "Lower Dibang Valley", "Lower Siang", "Lower Subansiri", "Namsai", "Pakke Kessang", "Papum Pare", "Shi Yomi", "Siang", "Tawang", "Tirap", "Upper Siang", "Upper Subansiri", "West Kameng", "West Siang"],
  "Assam": ["Bajali", "Baksa", "Barpeta", "Biswanath", "Bongaigaon", "Cachar", "Charaideo", "Chirang", "Darrang", "Dhemaji", "Dhubri", "Dibrugarh", "Dima Hasao", "Goalpara", "Golaghat", "Hailakandi", "Hojai", "Jorhat", "Kamrup", "Kamrup Metropolitan", "Karbi Anglong", "Karimganj", "Kokrajhar", "Lakhimpur", "Majuli", "Morigaon", "Nagaon", "Nalbari", "Sivasagar", "Sonitpur", "South Salmara-Mankachar", "Tamulpur", "Tinsukia", "Udalguri", "West Karbi Anglong"],
  "Bihar": ["Araria", "Arwal", "Aurangabad", "Banka", "Begusarai", "Bhagalpur", "Bhojpur", "Buxar", "Darbhanga", "East Champaran", "Gaya", "Gopalganj", "Jamui", "Jehanabad", "Kaimur", "Katihar", "Khagaria", "Kishanganj", "Lakhisarai", "Madhepura", "Madhubani", "Munger", "Muzaffarpur", "Nalanda", "Nawada", "Patna", "Purnia", "Rohtas", "Saharsa", "Samastipur", "Saran", "Sheikhpura", "Sheohar", "Sitamarhi", "Siwan", "Supaul", "Vaishali", "West Champaran"],
  "Chandigarh": ["Chandigarh"],
  "Chhattisgarh": ["Balod", "Baloda Bazar", "Balrampur", "Bastar", "Bemetara", "Bijapur", "Bilaspur", "Dantewada", "Dhamtari", "Durg", "Gariaband", "Gaurela-Pendra-Marwahi", "Janjgir-Champa", "Jashpur", "Kabirdham", "Khairagarh-Chhuikhadan-Gandai", "Kondagaon", "Korba", "Koriya", "Mahasamund", "Manendragarh-Chirmiri-Bharatpur", "Mohla-Manpur-Ambagarh Chowki", "Mungeli", "Narayanpur", "Raigarh", "Raipur", "Rajnandgaon", "Sakti", "Sarangarh-Bilaigarh", "Sukma", "Surajpur", "Surguja"],
  "Dadra and Nagar Haveli and Daman and Diu": ["Dadra and Nagar Haveli", "Daman", "Diu"],
  "Delhi": ["Central Delhi", "East Delhi", "New Delhi", "North Delhi", "North East Delhi", "North West Delhi", "Shahdara", "South Delhi", "South East Delhi", "South West Delhi", "West Delhi"],
  "Goa": ["North Goa", "South Goa"],
  "Gujarat": ["Ahmedabad", "Amreli", "Anand", "Aravalli", "Banaskantha", "Bharuch", "Bhavnagar", "Botad", "Chhota Udaipur", "Dahod", "Dang", "Devbhoomi Dwarka", "Gandhinagar", "Gir Somnath", "Jamnagar", "Junagadh", "Kheda", "Kutch", "Mahisagar", "Mehsana", "Morbi", "Narmada", "Navsari", "Panchmahal", "Patan", "Porbandar", "Rajkot", "Sabarkantha", "Surat", "Surendranagar", "Tapi", "Vadodara", "Valsad"],
  "Haryana": ["Ambala", "Bhiwani", "Charkhi Dadri", "Faridabad", "Fatehabad", "Gurugram", "Hisar", "Jhajjar", "Jind", "Kaithal", "Karnal", "Kurukshetra", "Mahendragarh", "Nuh", "Palwal", "Panchkula", "Panipat", "Rewari", "Rohtak", "Sirsa", "Sonipat", "Yamunanagar"],
  "Himachal Pradesh": ["Bilaspur", "Chamba", "Hamirpur", "Kangra", "Kinnaur", "Kullu", "Lahaul and Spiti", "Mandi", "Shimla", "Sirmaur", "Solan", "Una"],
  "Jammu and Kashmir": ["Anantnag", "Bandipora", "Baramulla", "Budgam", "Doda", "Ganderbal", "Jammu", "Kathua", "Kishtwar", "Kulgam", "Kupwara", "Poonch", "Pulwama", "Rajouri", "Ramban", "Reasi", "Samba", "Shopian", "Srinagar", "Udhampur"],
  "Jharkhand": ["Bokaro", "Chatra", "Deoghar", "Dhanbad", "Dumka", "East Singhbhum", "Garhwa", "Giridih", "Godda", "Gumla", "Hazaribagh", "Jamtara", "Khunti", "Koderma", "Latehar", "Lohardaga", "Pakur", "Palamu", "Ramgarh", "Ranchi", "Sahebganj", "Seraikela Kharsawan", "Simdega", "West Singhbhum"],
  "Karnataka": ["Bagalkot", "Ballari", "Belagavi", "Bengaluru Rural", "Bengaluru Urban", "Bidar", "Chamarajanagar", "Chikballapur", "Chikkamagaluru", "Chitradurga", "Dakshina Kannada", "Davanagere", "Dharwad", "Gadag", "Hassan", "Haveri", "Kalaburagi", "Kodagu", "Kolar", "Koppal", "Mandya", "Mysuru", "Raichur", "Ramanagara", "Shivamogga", "Tumakuru", "Udupi", "Uttara Kannada", "Vijayapura", "Yadgir", "Vijayanagara"],
  "Kerala": ["Alappuzha", "Ernakulam", "Idukki", "Kannur", "Kasaragod", "Kollam", "Kottayam", "Kozhikode", "Malappuram", "Palakkad", "Pathanamthitta", "Thiruvananthapuram", "Thrissur", "Wayanad"],
  "Ladakh": ["Kargil", "Leh"],
  "Lakshadweep": ["Lakshadweep"],
  "Madhya Pradesh": ["Agar Malwa", "Alirajpur", "Anuppur", "Ashoknagar", "Balaghat", "Barwani", "Betul", "Bhind", "Bhopal", "Burhanpur", "Chhatarpur", "Chhindwara", "Damoh", "Datia", "Dewas", "Dhar", "Dindori", "Guna", "Gwalior", "Harda", "Indore", "Jabalpur", "Jhabua", "Katni", "Khandwa", "Khargone", "Maihar", "Mandla", "Mandsaur", "Morena", "Narmadapuram", "Narsinghpur", "Neemuch", "Niwari", "Pandhurna", "Panna", "Raisen", "Rajgarh", "Ratlam", "Rewa", "Sagar", "Satna", "Sehore", "Seoni", "Shahdol", "Shajapur", "Sheopur", "Shivpuri", "Sidhi", "Singrauli", "Tikamgarh", "Ujjain", "Umaria", "Vidisha"],
  "Maharashtra": ["Ahmednagar", "Akola", "Amravati", "Aurangabad", "Beed", "Bhandara", "Buldhana", "Chandrapur", "Dhule", "Gadchiroli", "Gondia", "Hingoli", "Jalgaon", "Jalna", "Kolhapur", "Latur", "Mumbai City", "Mumbai Suburban", "Nagpur", "Nanded", "Nandurbar", "Nashik", "Osmanabad", "Palghar", "Parbhani", "Pune", "Raigad", "Ratnagiri", "Sangli", "Satara", "Sindhudurg", "Solapur", "Thane", "Wardha", "Washim", "Yavatmal"],
  "Manipur": ["Bishnupur", "Chandel", "Churachandpur", "Imphal East", "Imphal West", "Jiribam", "Kakching", "Kamjong", "Kangpokpi", "Noney", "Pherzawl", "Senapati", "Tamenglong", "Tengnoupal", "Thoubal", "Ukhrul"],
  "Meghalaya": ["East Garo Hills", "East Jaintia Hills", "East Khasi Hills", "North Garo Hills", "Ri-Bhoi", "South Garo Hills", "South West Garo Hills", "South West Khasi Hills", "West Garo Hills", "West Jaintia Hills", "West Khasi Hills"],
  "Mizoram": ["Aizawl", "Champhai", "Hnahthial", "Khawzawl", "Kolasib", "Lawngtlai", "Lunglei", "Mamit", "Saiha", "Saitual", "Serchhip"],
  "Nagaland": ["Chümoukedima", "Dimapur", "Kiphire", "Kohima", "Longleng", "Mokokchung", "Mon", "Niuland", "Noklak", "Peren", "Phek", "Shamator", "Tseminyü", "Tuensang", "Wokha", "Zunheboto"],
  "Odisha": ["Angul", "Balangir", "Balasore", "Bargarh", "Bhadrak", "Boudh", "Cuttack", "Deogarh", "Dhenkanal", "Gajapati", "Ganjam", "Jagatsinghpur", "Jajpur", "Jharsuguda", "Kalahandi", "Kandhamal", "Kendrapara", "Kendujhar", "Khordha", "Koraput", "Malkangiri", "Mayurbhanj", "Nabarangpur", "Nayagarh", "Nuapada", "Puri", "Rayagada", "Sambalpur", "Subarnapur", "Sundargarh"],
  "Puducherry": ["Karaikal", "Mahe", "Puducherry", "Yanam"],
  "Punjab": ["Amritsar", "Barnala", "Bathinda", "Faridkot", "Fatehgarh Sahib", "Fazilka", "Ferozepur", "Gurdaspur", "Hoshiarpur", "Jalandhar", "Kapurthala", "Ludhiana", "Malerkotla", "Mansa", "Moga", "Muktsar", "Pathankot", "Patiala", "Rupnagar", "Sahibzada Ajit Singh Nagar", "Sangrur", "Shaheed Bhagat Singh Nagar", "Tarn Taran"],
  "Rajasthan": ["Ajmer", "Alwar", "Anupgarh", "Balotra", "Banswara", "Baran", "Barmer", "Beawar", "Bharatpur", "Bhilwara", "Bikaner", "Bundi", "Chittorgarh", "Churu", "Dausa", "Deeg", "Dholpur", "Didwana Kuchaman", "Dudu", "Dungarpur", "Gangapur City", "Hanumangarh", "Jaipur", "Jaipur Rural", "Jaisalmer", "Jalore", "Jhalawar", "Jhunjhunu", "Jodhpur", "Jodhpur Rural", "Kekri", "Karauli", "Khairthal-Tijara", "Kota", "Kotputli-Behror", "Nagaur", "Neem Ka Thana", "Pali", "Phalodi", "Pratapgarh", "Rajsamand", "Salumber", "Sanchore", "Sawai Madhopur", "Shahpura", "Sikar", "Sirohi", "Sri Ganganagar", "Tonk", "Udaipur"],
  "Sikkim": ["Gangtok", "Gyalshing", "Mangan", "Namchi", "Pakyong", "Soreng"],
  "Tamil Nadu": ["Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore", "Dharmapuri", "Dindigul", "Erode", "Kallakurichi", "Kanchipuram", "Kanyakumari", "Karur", "Krishnagiri", "Madurai", "Mayiladuthurai", "Nagapattinam", "Namakkal", "Nilgiris", "Perambalur", "Pudukkottai", "Ramanathapuram", "Ranipet", "Salem", "Sivaganga", "Tenkasi", "Thanjavur", "Theni", "Thoothukudi", "Tiruchirappalli", "Tirunelveli", "Tirupathur", "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Tiruvarur", "Vellore", "Viluppuram", "Virudhunagar"],
  "Telangana": ["Adilabad", "Bhadradri Kothagudem", "Hanumakonda", "Hyderabad", "Jagtial", "Jangaon", "Jayashankar Bhupalpally", "Jogulamba Gadwal", "Kamareddy", "Karimnagar", "Khammam", "Komaram Bheem", "Mahabubabad", "Mahabubnagar", "Mancherial", "Medak", "Medchal-Malkajgiri", "Mulugu", "Nagarkurnool", "Nalgonda", "Narayanpet", "Nirmal", "Nizamabad", "Peddapalli", "Rajanna Sircilla", "Ranga Reddy", "Sangareddy", "Siddipet", "Suryapet", "Vikarabad", "Wanaparthy", "Warangal", "Yadadri Bhuvanagiri"],
  "Tripura": ["Dhalai", "Gomati", "Khowai", "North Tripura", "Sepahijala", "South Tripura", "Unakoti", "West Tripura"],
  "Uttar Pradesh": ["Agra", "Aligarh", "Ambedkar Nagar", "Amethi", "Amroha", "Auraiya", "Ayodhya", "Azamgarh", "Baghpat", "Bahraich", "Ballia", "Balrampur", "Banda", "Barabanki", "Bareilly", "Basti", "Bhadohi", "Bijnor", "Budaun", "Bulandshahr", "Chandauli", "Chitrakoot", "Deoria", "Etah", "Etawah", "Farrukhabad", "Fatehpur", "Firozabad", "Gautam Buddha Nagar", "Ghaziabad", "Ghazipur", "Gonda", "Gorakhpur", "Hamirpur", "Hapur", "Hardoi", "Hathras", "Jalaun", "Jaunpur", "Jhansi", "Kannauj", "Kanpur Dehat", "Kanpur Nagar", "Kasganj", "Kaushambi", "Kushinagar", "Lakhimpur Kheri", "Lalitpur", "Lucknow", "Maharajganj", "Mahoba", "Mainpuri", "Mathura", "Mau", "Meerut", "Mirzapur", "Moradabad", "Muzaffarnagar", "Pilibhit", "Pratapgarh", "Prayagraj", "Raebareli", "Rampur", "Saharanpur", "Sambhal", "Sant Kabir Nagar", "Shahjahanpur", "Shamli", "Shrawasti", "Siddharthnagar", "Sitapur", "Sonbhadra", "Sultanpur", "Unnao", "Varanasi"],
  "Uttarakhand": ["Almora", "Bageshwar", "Chamoli", "Champawat", "Dehradun", "Haridwar", "Nainital", "Pauri Garhwal", "Pithoragarh", "Rudraprayag", "Tehri Garhwal", "Udham Singh Nagar", "Uttarkashi"],
  "West Bengal": ["Alipurduar", "Bankura", "Birbhum", "Cooch Behar", "Dakshin Dinajpur", "Darjeeling", "Hooghly", "Howrah", "Jalpaiguri", "Jhargram", "Kalimpong", "Kolkata", "Malda", "Murshidabad", "Nadia", "North 24 Parganas", "Paschim Bardhaman", "Paschim Medinipur", "Purba Bardhaman", "Purba Medinipur", "Purulia", "South 24 Parganas", "Uttar Dinajpur"]
};


const HostingApplicationForm = ({ visible, onClose }) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    accountType: "Individual",
    companyName: "",
    phoneNumber: "+91",
    altPhoneNumber: "",
    email: "",
    altEmail: "",
    address: "",
    pincode: "",
    location: "",
    country: "India",
    state: "",
    district: "",
    latitude: "",
    longitude: "",
    interestIds: []
  });

  const [businessInterests, setBusinessInterests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [otp, setOtp] = useState("");
  const [applicationData, setApplicationData] = useState(null);
  
  const addressInputRef = useRef(null);
  const autocompleteRef = useRef(null);

  useEffect(() => {
    if (!visible) return;

    const initAutocomplete = () => {
      if (!window.google?.maps?.places?.Autocomplete || !addressInputRef.current) return;
      
      autocompleteRef.current = new window.google.maps.places.Autocomplete(addressInputRef.current, {
        fields: ["address_components", "geometry", "formatted_address", "name"],
      });

      autocompleteRef.current.addListener("place_changed", () => {
        const place = autocompleteRef.current.getPlace();
        if (!place.geometry) return;

        let newLocation = "";
        let newPincode = "";
        let newState = "";
        let newDistrict = "";
        let newCountry = "India";

        if (place.address_components) {
          for (const component of place.address_components) {
            const types = component.types;
            if (types.includes("locality") || types.includes("postal_town")) {
              newLocation = component.long_name;
            }
            if (types.includes("administrative_area_level_1")) {
              newState = component.long_name;
            }
            if (types.includes("administrative_area_level_3") || types.includes("administrative_area_level_2")) {
              newDistrict = component.long_name;
            }
            if (types.includes("postal_code")) {
              newPincode = component.long_name;
            }
            if (types.includes("country")) {
              newCountry = component.long_name;
            }
          }
        }

        setFormData(prev => ({
          ...prev,
          address: place.formatted_address || place.name || prev.address,
          location: newLocation || prev.location,
          state: newState || prev.state,
          district: newDistrict || prev.district,
          pincode: newPincode || prev.pincode,
          country: newCountry || prev.country,
          latitude: place.geometry.location.lat().toString(),
          longitude: place.geometry.location.lng().toString()
        }));
      });
    };

    if (window.google?.maps?.places?.Autocomplete) {
      initAutocomplete();
      return;
    }

    if (!GOOGLE_MAPS_API_KEY) {
      console.warn("Google Maps API Key is missing");
      return;
    }

    const existingScript = document.getElementById(GOOGLE_MAPS_SCRIPT_ID);
    if (existingScript) {
      existingScript.addEventListener("load", initAutocomplete);
      return () => existingScript.removeEventListener("load", initAutocomplete);
    }

    const script = document.createElement("script");
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.addEventListener("load", initAutocomplete);
    document.head.appendChild(script);

    return () => {
      script.removeEventListener("load", initAutocomplete);
    };
  }, [visible]);

  useEffect(() => {
    if (visible) {
      const fetchInterests = async () => {
        try {
          const interests = await getBusinessInterests();
          setBusinessInterests(interests);
        } catch (err) {
          console.error("Failed to load business interests", err);
        }
      };
      fetchInterests();
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) {
      // Reset form
      setFormData({
        firstName: "",
        lastName: "",
        accountType: "Individual",
        companyName: "",
        phoneNumber: "+91",
        altPhoneNumber: "",
        email: "",
        altEmail: "",
        address: "",
        pincode: "",
        location: "",
        country: "India",
        state: "",
        district: "",
        latitude: "",
        longitude: "",
        interestIds: []
      });
      setError(null);
      setSuccess(null);
      setSessionId(null);
      setOtp("");
      setApplicationData(null);
      setLoading(false);
    }
  }, [visible]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "firstName" || name === "lastName") {
      if (value !== "" && !/^[a-zA-Z\s]*$/.test(value)) return;
    }

    if (name === "phoneNumber") {
      if (value !== "" && !/^\+?[0-9]*$/.test(value)) return;
      
      let val = value;
      if (!val.startsWith("+91")) {
        val = "+91";
      }
      
      if (val.length > 13) return;
      
      setFormData(prev => ({ ...prev, [name]: val }));
      return;
    }

    if (name === "state") {
      setFormData(prev => ({ ...prev, [name]: value, district: "" }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleInterestToggle = (id) => {
    setFormData(prev => {
      const isSelected = prev.interestIds.includes(id);
      return {
        ...prev,
        interestIds: isSelected 
          ? prev.interestIds.filter(i => i !== id) 
          : [...prev.interestIds, id]
      };
    });
  };

  const getFriendlyError = (err) => {
    if (err?.response) {
      const status = err.response.status;
      const data = err.response.data;
      if (status === 400) {
        if (data.details) {
          return `Validation Error: ${Object.values(data.details).join(", ")}`;
        }
        return data.error || "Please check your form and try again.";
      }
      if (status === 409) {
        return data.error || "A lead with this email or phone number already exists.";
      }
      if (status >= 500) {
        return data.error || "Internal Server Error. Please try again later.";
      }
      return data.error || data.message || "An error occurred. Please try again.";
    }
    return "Network error. Please try again.";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Basic required validation
    if (!formData.firstName.trim()) return setError("First Name is required");
    
    if (!formData.email.trim()) return setError("Email is required");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) return setError("Please enter a valid email address");

    if (!formData.phoneNumber.trim()) return setError("Phone Number is required");
    const phoneRegex = /^\+91[0-9]{10}$/;
    if (!phoneRegex.test(formData.phoneNumber.trim())) return setError("Phone number must be +91 followed by 10 digits");

    if (!formData.address.trim()) return setError("Address is required");
    if (formData.interestIds.length === 0) return setError("Please select at least one Business Interest");

    setLoading(true);
    try {
      const response = await requestHostingOtp(formData);
      setSuccess(`OTP requested successfully. Sent to ${response.maskedPhone} and ${response.maskedEmail}`);
      setSessionId(response.sessionId);
    } catch (err) {
      setError(getFriendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!otp || otp.length < 6) return setError("Please enter a valid 6-digit OTP");

    setLoading(true);
    try {
      const response = await verifyHostingOtp(sessionId, otp);
      setApplicationData(response);
      setSuccess("Application submitted successfully!");
    } catch (err) {
      setError(getFriendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const response = await resendHostingOtp(sessionId);
      setSuccess(`OTP resent successfully.`);
      if (response.sessionId) {
        setSessionId(response.sessionId);
      }
    } catch (err) {
      setError(getFriendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return createPortal(
    <div className={styles.modal}>
      <div className={styles.content}>
        <button className={styles.close} onClick={onClose}>
          <Icon name="close" size="14" />
        </button>

        <div className={styles.header}>
          <div className={cn("h3", styles.title)}>Become a Host</div>
          <div className={styles.info}>Join our community and host unique experiences</div>
        </div>

        {applicationData ? (
          <div className={styles.success}>
            <p className={cn("h4", styles.successTitle)}>{success}</p>
            <div className={styles.applicationDetails}>
              <p><strong>Application ID:</strong> {applicationData.applicationId}</p>
              <p><strong>Name:</strong> {applicationData.fullName}</p>
              <p><strong>Account Type:</strong> {applicationData.accountType}</p>
              <p><strong>Email:</strong> {applicationData.email}</p>
              {applicationData.altEmail && <p><strong>Alt Email:</strong> {applicationData.altEmail}</p>}
              <p><strong>Phone:</strong> {applicationData.phoneNumber}</p>
              <p><strong>Address:</strong> {applicationData.address}</p>
              {applicationData.location && <p><strong>Location:</strong> {applicationData.location}</p>}
              <p><strong>District:</strong> {applicationData.district}</p>
              <p><strong>State:</strong> {applicationData.state}</p>
              <p><strong>Pincode:</strong> {applicationData.pincode}</p>
              <p><strong>Interests:</strong> {applicationData.selectedBusinessInterests?.join(", ")}</p>
              <p><strong>Submitted Date:</strong> {new Date(applicationData.submittedDate).toLocaleString()}</p>
            </div>
            <button className={styles.button} onClick={onClose} style={{ marginTop: "24px" }}>
              Close
            </button>
          </div>
        ) : sessionId ? (
          <form className={styles.form} onSubmit={handleVerifyOtp}>
            {success && <div className={styles.successMessage}>{success}</div>}
            <div className={styles.field}>
              <label className={styles.label}>Enter OTP *</label>
              <input 
                type="text" 
                className={styles.input} 
                name="otp" 
                value={otp} 
                onChange={(e) => setOtp(e.target.value)} 
                placeholder="123456" 
                maxLength={6}
                disabled={loading} 
                required 
              />
            </div>
            {error && <div className={styles.error}>{error}</div>}
            <div className={styles.row}>
              <button type="submit" className={styles.button} disabled={loading}>
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
              <button type="button" className={cn(styles.button, styles.outlineButton)} onClick={handleResendOtp} disabled={loading} style={{ background: "transparent", color: "#007489", border: "1px solid #007489" }}>
                Resend OTP
              </button>
            </div>
          </form>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>First Name *</label>
                <input type="text" className={styles.input} name="firstName" value={formData.firstName} onChange={handleChange} placeholder="Your Name" disabled={loading} required />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Last Name</label>
                <input type="text" className={styles.input} name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Your Last Name" disabled={loading} />
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>Email *</label>
                <input type="email" className={styles.input} name="email" value={formData.email} onChange={handleChange} placeholder="youremail@gmail.com" disabled={loading} required />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Phone Number *</label>
                <input type="tel" className={styles.input} name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} placeholder="+919876543210" maxLength={13} disabled={loading} required />
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>Account Type</label>
                <select className={styles.select} name="accountType" value={formData.accountType} onChange={handleChange} disabled={loading}>
                  <option value="Individual">Individual</option>
                  <option value="Company">Company</option>
                </select>
              </div>
              {formData.accountType === "Company" && (
                <div className={styles.field}>
                  <label className={styles.label}>Company Name</label>
                  <input type="text" className={styles.input} name="companyName" value={formData.companyName} onChange={handleChange} placeholder="Company Ltd" disabled={loading} />
                </div>
              )}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Address *</label>
              <input 
                ref={addressInputRef}
                type="text" 
                className={styles.input} 
                name="address" 
                value={formData.address} 
                onChange={handleChange} 
                placeholder="Search your address..." 
                disabled={loading} 
                required 
              />
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>City/Location</label>
                <input type="text" className={styles.input} name="location" value={formData.location} onChange={handleChange} placeholder="Your City" disabled={loading} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Pincode</label>
                <input type="text" className={styles.input} name="pincode" value={formData.pincode} onChange={handleChange} placeholder="Your Pincode" disabled={loading} />
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>State *</label>
                <select className={styles.select} name="state" value={formData.state} onChange={handleChange} disabled={loading} required>
                  <option value="" disabled>Select State</option>
                  {Object.keys(INDIA_STATE_DISTRICTS).map((state) => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>District *</label>
                <select className={styles.select} name="district" value={formData.district} onChange={handleChange} disabled={loading || !formData.state} required>
                  <option value="" disabled>Select District</option>
                  {formData.state && INDIA_STATE_DISTRICTS[formData.state]?.map((district) => (
                    <option key={district} value={district}>{district}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Business Interests *</label>
              <div className={styles.interestsGroup}>
                {businessInterests.map(interest => (
                  <label key={interest.interestId} className={styles.interestCheckbox}>
                    <input 
                      type="checkbox" 
                      checked={formData.interestIds.includes(interest.interestId)}
                      onChange={() => handleInterestToggle(interest.interestId)}
                      disabled={loading}
                    />
                    <div className={styles.interestInfo}>
                      <span className={styles.interestName}>{interest.displayName || interest.code}</span>
                      {interest.subtitle && <span className={styles.interestSub}>{interest.subtitle}</span>}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <button type="submit" className={styles.button} disabled={loading}>
              {loading ? "Requesting OTP..." : "Submit Application"}
            </button>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
};

export default HostingApplicationForm;
