const fs = require('fs');
const path = require('path');
const https = require('https');

const dataDir = path.join(__dirname, 'test_data');
const imagesDir = path.join(dataDir, 'images');

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}
if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir);
}

const firstNames = ['Christian', 'John', 'Jane', 'Michael', 'Emily', 'William', 'Emma', 'James', 'Olivia', 'Alexander', 'Sophia', 'Benjamin', 'Isabella', 'Jacob', 'Mia', 'Elijah', 'Charlotte', 'Ethan', 'Amelia', 'Daniel'];
const lastNames = ['Sebastial', 'Doe', 'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore'];
const departments = ['Science', 'Arts', 'Commerce', 'Engineering', 'Medicine', 'Law', 'Business', 'Architecture', 'Design', 'Music'];
const streets = ['Main St', 'Oak St', 'Pine St', 'Maple Ave', 'Cedar Ln', 'Elm St', 'Washington St', 'Lake St', 'Hill Rd', 'Park Ave'];

let csvContent = 'First Name,Last Name,Date of Birth,ID number,Grade/Class,Street 1,Parent Name,Parent Phone,Image\n';

const downloadFile = (url, dest) => {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                return downloadFile(response.headers.location, dest).then(resolve).catch(reject);
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
        const firstName = firstNames[i - 1];
        const lastName = lastNames[i - 1];
        const dob = `200${Math.floor(Math.random() * 5) + 1}-0${Math.floor(Math.random() * 9) + 1}-1${Math.floor(Math.random() * 9)}`;
        const idNumber = `009-007-${i.toString().padStart(3, '0')}`;
        const gradeClass = departments[i % departments.length];
        const street = `${Math.floor(Math.random() * 1000) + 1} ${streets[i % streets.length]}`;
        const parentName = `Mr. ${lastName}`;
        const parentPhone = `555-010-${i.toString().padStart(2, '0')}`;
        const imageName = `${i}.png`; // user wanted 1.png, 2.png etc.
        
        // Ensure exact columns from image
        csvContent += `${firstName},${lastName},${dob},${idNumber},${gradeClass},${street},${parentName},${parentPhone},${imageName}\n`;
        
        const imageUrl = `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=random&size=200`;
        const imagePath = path.join(imagesDir, imageName);
        
        console.log(`Downloading image for ${firstName} ${lastName} (${imageName})...`);
        try {
            await downloadFile(imageUrl, imagePath);
        } catch(e) {
            console.log('Failed to download image', e);
        }
    }

    fs.writeFileSync(path.join(dataDir, 'students.csv'), csvContent);
    console.log('Data generation complete! Files are in the test_data folder.');
}

generate();
