const fs = require('fs');
const path = require('path');
const https = require('https');

const dataDir = path.join(__dirname, 'test_data');
const imagesDir = path.join(dataDir, 'images');

const firstNames = [
  { name: 'Christian', gender: 'men' },
  { name: 'John', gender: 'men' },
  { name: 'Jane', gender: 'women' },
  { name: 'Michael', gender: 'men' },
  { name: 'Emily', gender: 'women' },
  { name: 'William', gender: 'men' },
  { name: 'Emma', gender: 'women' },
  { name: 'James', gender: 'men' },
  { name: 'Olivia', gender: 'women' },
  { name: 'Alexander', gender: 'men' },
  { name: 'Sophia', gender: 'women' },
  { name: 'Benjamin', gender: 'men' },
  { name: 'Isabella', gender: 'women' },
  { name: 'Jacob', gender: 'men' },
  { name: 'Mia', gender: 'women' },
  { name: 'Elijah', gender: 'men' },
  { name: 'Charlotte', gender: 'women' },
  { name: 'Ethan', gender: 'men' },
  { name: 'Amelia', gender: 'women' },
  { name: 'Daniel', gender: 'men' }
];

const lastNames = ['Sebastial', 'Doe', 'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore'];
const departments = ['Science', 'Arts', 'Commerce', 'Engineering', 'Medicine', 'Law', 'Business', 'Architecture', 'Design', 'Music'];
const streets = ['Main St', 'Oak St', 'Pine St', 'Maple Ave', 'Cedar Ln', 'Elm St', 'Washington St', 'Lake St', 'Hill Rd', 'Park Ave'];

let csvContent = 'First Name,Last Name,Date of Birth,ID number,Grade/Class,Street 1,Parent Name,Parent Phone,Image\n';

const downloadFile = (url, dest) => {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                return downloadFile(response.headers.location, dest).then(resolve).catch(reject);
            }
            if (response.statusCode !== 200) {
                 return reject(new Error('Failed ' + response.statusCode));
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close(resolve);
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => {});
            reject(err);
        });
    });
};

async function generate() {
    for (let i = 1; i <= 20; i++) {
        const person = firstNames[i - 1];
        const lastName = lastNames[i - 1];
        const dob = `200${Math.floor(Math.random() * 5) + 1}-0${Math.floor(Math.random() * 9) + 1}-1${Math.floor(Math.random() * 9)}`;
        const idNumber = `009-007-${i.toString().padStart(3, '0')}`;
        const gradeClass = departments[i % departments.length];
        const street = `${Math.floor(Math.random() * 1000) + 1} ${streets[i % streets.length]}`;
        const parentName = `Mr. ${lastName}`;
        const parentPhone = `555-010-${i.toString().padStart(2, '0')}`;
        const imageName = `${i}.jpg`; 
        
        csvContent += `${person.name},${lastName},${dob},${idNumber},${gradeClass},${street},${parentName},${parentPhone},${imageName}\n`;
        
        const imageUrl = `https://randomuser.me/api/portraits/${person.gender}/${i + 10}.jpg`; // Using +10 offset for variety
        const imagePath = path.join(imagesDir, imageName);
        
        console.log(`Downloading face image for ${person.name} ${lastName} (${imageName})...`);
        try {
            await downloadFile(imageUrl, imagePath);
        } catch(e) {
            console.log(`Failed to download image from ${imageUrl}`, e);
        }
    }

    fs.writeFileSync(path.join(dataDir, 'students_with_faces.csv'), csvContent);
    console.log('Data generation complete with real faces! CSV updated to use .jpg extensions.');
}

generate();
