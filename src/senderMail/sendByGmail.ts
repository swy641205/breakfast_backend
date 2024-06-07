import gmail, { type ILetter } from "./gmail";

const myLetter: ILetter = {
    from: process.env.MAIL_SENDER as string,
    to: '1@ouob.net',
    subject: 'Hello',
    html: '<h1>Hello</h1>',
};

const info = await gmail.send(myLetter);
console.log(info);