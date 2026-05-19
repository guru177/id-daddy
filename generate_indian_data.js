const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'test_data');
const imagesDir = path.join(dataDir, 'images');

// Clean up old files
try {
  if (fs.existsSync(imagesDir)) {
    fs.readdirSync(imagesDir).forEach(f => {
        try { fs.unlinkSync(path.join(imagesDir, f)); } catch(e) {}
    });
  } else {
    fs.mkdirSync(imagesDir, { recursive: true });
  }
  const files = fs.readdirSync(dataDir);
  files.forEach(f => {
    if (f.endsWith('.csv') || f.endsWith('.js')) {
        try { fs.unlinkSync(path.join(dataDir, f)); } catch(e) {}
    }
  });
} catch(e) {
  console.log('Cleanup error', e);
}

const firstNames = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan',
  'Saanvi', 'Aadya', 'Kiara', 'Diya', 'Pihu', 'Prisha', 'Ananya', 'Avni', 'Kavya', 'Myra'
];
const lastNames = ['Sharma', 'Verma', 'Gupta', 'Patel', 'Singh', 'Kumar', 'Rao', 'Desai', 'Reddy', 'Joshi', 'Iyer', 'Das', 'Sen', 'Bose', 'Nair', 'Menon', 'Mehta', 'Shah', 'Agarwal', 'Chopra'];
const departments = ['Science', 'Arts', 'Commerce', 'Engineering', 'Medicine', 'Law', 'Business', 'Architecture', 'Design', 'Music'];
const streets = ['MG Road', 'Linking Road', 'Brigade Road', 'Park Street', 'Connaught Place', 'Indiranagar', 'Juhu', 'Bandra', 'Koramangala', 'Andheri'];

let csvContent = 'First Name,Last Name,Date of Birth,ID number,Grade/Class,Street 1,Parent Name,Parent Phone,Image\n';

for (let i = 1; i <= 20; i++) {
    const firstName = firstNames[i - 1];
    const lastName = lastNames[i - 1];
    const dob = `200${Math.floor(Math.random() * 5) + 1}-0${Math.floor(Math.random() * 9) + 1}-1${Math.floor(Math.random() * 9)}`;
    const idNumber = `009-007-${i.toString().padStart(3, '0')}`;
    const gradeClass = departments[i % departments.length];
    const street = `${Math.floor(Math.random() * 100) + 1} ${streets[i % streets.length]}, India`;
    const parentName = `Mr. ${lastName}`;
    const parentPhone = `+91 98${Math.floor(10000000 + Math.random() * 90000000)}`;
    const imageName = `${i}.png`; 
    
    csvContent += `${firstName},${lastName},${dob},${idNumber},${gradeClass},${street},${parentName},${parentPhone},${imageName}\n`;
}

try {
    fs.writeFileSync(path.join(dataDir, 'students_indian.csv'), csvContent);
    console.log('Indian student CSV generated!');
} catch(e) {
    console.error('Failed to write CSV', e);
}
