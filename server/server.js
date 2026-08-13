import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";

import { connectDatabase } from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import issueRoutes from "./routes/issueRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";


dotenv.config();


const app = express();


// ===============================
// Database Connection
// ===============================

try {

    await connectDatabase();

} catch (error) {

    console.error(
        "Database startup failed:",
        error.message
    );

    process.exit(1);

}



// ===============================
// Middleware
// ===============================


app.use(

    cors({

        origin:
            "http://localhost:5173",

        credentials:
            true,

    })

);


app.use(express.json());


app.use(

    express.urlencoded({

        extended:true

    })

);



// ===============================
// Static Files
// ===============================


app.use(

    "/uploads",

    express.static(

        path.join(

            process.cwd(),

            "uploads"

        )

    )

);



// ===============================
// Routes
// ===============================


app.use(

    "/api/auth",

    authRoutes

);


app.use(

    "/api/issues",

    issueRoutes

);


app.use(

    "/api/uploads",

    uploadRoutes

);



// ===============================
// Test Routes
// ===============================


app.get(

    "/",

    (req,res)=>{


        res.status(200).json({

            success:true,

            message:
            "DhakAI-PAKHI backend is running."

        });


    }

);



app.get(

    "/api/health",

    (req,res)=>{


        res.status(200).json({

            success:true,

            message:
            "DhakAI-PAKHI backend is healthy."

        });


    }

);



// ===============================
// 404 Handler
// ===============================


app.use(

    (req,res)=>{


        res.status(404).json({

            success:false,

            message:
            `Route not found: ${req.method} ${req.originalUrl}`

        });


    }

);



// ===============================
// Error Handler
// ===============================


app.use(

    (error,req,res,next)=>{


        console.error(

            "Server error:",

            error

        );


        res.status(

            error.status || 500

        ).json({

            success:false,

            message:

            error.message ||

            "Unexpected server error"

        });


    }

);



// ===============================
// Server Start
// ===============================


const PORT = process.env.PORT || 5000;


app.listen(

    PORT,

    ()=>{


        console.log(

            `DhakAI-PAKHI server running on http://localhost:${PORT}`

        );


    }

);