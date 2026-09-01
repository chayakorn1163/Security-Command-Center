import "./globals.css";

export const metadata = {
  title: "Security Command Center",
  description: "CJ Logistics — Security Command Center",
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@700;800&family=Prompt:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
      </head>
      <body className="font-body bg-[#f0f4f8] text-[#191c1d]">{children}</body>
    </html>
  );
}
