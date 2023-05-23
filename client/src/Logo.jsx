export default function Logo() {
  return (
    <div className="text-sky-500 font-bold flex gap-2 p-4">
       <svg xmlns="http://www.w3.org/2000/svg"  className="w-6 h-6" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="90" fill="#87CEEB" />
            <circle cx="100" cy="100" r="70" fill="#FFFFFF" />
            <path d="M70 120l30-20 30 20v-40l-30-20-30 20z" fill="#00BFFF" />
          </svg>
      Chatify 
    </div>
  );
}