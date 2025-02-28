import multer from 'multer';
import path from "path"
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if(!path.existsSync('uploads/')){
      fs.mkdirSync('uploads/');
    }

    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
}); 



export const Upload = multer({ storage: storage });