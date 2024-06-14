import nodemailer from "nodemailer";

const tranporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.MAIL_SENDER,
        pass: process.env.MAIL_PASS,
    },
});


export interface ILetter {
    from: string;
    to: string;
    subject: string;
    html: string;
}

const gmail = {
    send: async (letter: ILetter) => {
        try {
            const info = await tranporter.sendMail(letter);
            return { status: "success", info };
        } catch (err) {
            return { status: "error", err };
        } 
    },
};

export default gmail;