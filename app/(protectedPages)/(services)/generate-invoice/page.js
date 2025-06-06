"use client";
import { useState, useEffect } from "react";
import { useGlobalContext } from "@/context/GlobalContext";
import { FaDownload, FaEnvelope, FaEye, FaPlus, FaTrash } from "react-icons/fa";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { toast } from "react-toastify";
import { billzpaddi } from "@/lib/client";
import { HiDocumentText } from "react-icons/hi";
import { useGlobalContextData } from "@/context/GlobalContextData";

const CurrencySelector = ({ selectedCurrency, onSelect }) => {
  const currencies = [
    { code: "NGN", symbol: "₦", name: "Naira" },
    { code: "USD", symbol: "$", name: "Dollar" },
    { code: "EUR", symbol: "€", name: "Euro" },
    { code: "GBP", symbol: "£", name: "Pound" },
    { code: "GHS", symbol: "GH₵", name: "Cedi" },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 mt-4">
      {currencies.map((currency) => (
        <button
          key={currency.code}
          onClick={() => onSelect(currency)}
          className={`p-1 border rounded-lg flex cursor-pointer items-center justify-center transition-colors ${
            selectedCurrency === currency.code
              ? "bg-gray-900 text-white border-gray-800"
              : "bg-gray-700 hover:bg-gray-600 border-gray-600"
          }`}
        >
          <span className="font-bold mr-1">{currency.symbol}</span>
          <span className="text-xs">{currency.code}</span>
        </button>
      ))}
    </div>
  );
};

export default function InvoiceGenerator() {
  const { user, isLoading } = useGlobalContext();
  const {
    uniqueRequestId,
    getUniqueRequestId,
    wallet,
    fetchWallet,
    fetchTransactions,
  } = useGlobalContextData();
  const [invoice, setInvoice] = useState({
    vendorName: "",
    vendorLogo: null,
    vendorEmail: "",
    vendorPhone: "",
    customerName: "",
    customerEmail: "",
    currency: "NGN",
    currencySymbol: "₦",
    invoiceDate: new Date().toISOString().split("T")[0],
    invoiceNumber: `INV-${Math.floor(Math.random() * 10000)}`,
    items: [{ name: "", quantity: 1, price: 0 }],
    taxRate: 0,
    discount: 0,
    notes: "",
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [invoiceCount, setInvoiceCount] = useState(0);
  const [blob, setBlob] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [logoPreview, setLogoPreview] = useState(null);
  const [processingFee] = useState(25); // processing fee

  useEffect(() => {
    fetchWallet();
  }, []);

  const handleCurrencyChange = (currency) => {
    setInvoice((prev) => ({
      ...prev,
      currency: currency.code,
      currencySymbol: currency.symbol,
    }));
  };

  // Calculate totals
  const subtotal = invoice.items.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0
  );
  const taxAmount = subtotal * (invoice.taxRate / 100);
  const discountAmount = subtotal * (invoice.discount / 100);
  const total = subtotal + taxAmount - discountAmount;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInvoice((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...invoice.items];
    updatedItems[index][field] = field === "name" ? value : Number(value);
    setInvoice((prev) => ({ ...prev, items: updatedItems }));
  };

  const addItem = () => {
    setInvoice((prev) => ({
      ...prev,
      items: [...prev.items, { name: "", quantity: 1, price: 0 }],
    }));
  };

  const removeItem = (index) => {
    if (invoice.items.length > 1) {
      const updatedItems = invoice.items.filter((_, i) => i !== index);
      setInvoice((prev) => ({ ...prev, items: updatedItems }));
    }
  };

  // In your handleLogoUpload function:
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Create preview with mobile-responsive sizing
    const reader = new FileReader();
    reader.onload = () => {
      setLogoPreview(reader.result);
      setInvoice((prev) => ({ ...prev, vendorLogo: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    getUniqueRequestId();
  }, []);

  // Get user's total invoice count (lifetime)
  const fetchInvoiceCount = async () => {
    if (!user) return;
    const { data: invoiceGeneration, error: invoiceGenError } = await billzpaddi
      .from("invoice_generations")
      .select("invoice_count")
      .eq("user_id", user?.user_id)
      .single();

    if (invoiceGenError && invoiceGenError.code !== "PGRST116") {
      throw invoiceGenError;
    }

    setInvoiceCount(invoiceGeneration?.invoice_count);
  };

  useEffect(() => {
    fetchInvoiceCount();
  }, [user, blob]);

  const deductFee = async () => {
    if (!user) return;
    try {
      const FREE_INVOICE_LIMIT = 100;

      setIsGenerating(true);

      // Get user's total invoice count (lifetime)
      const { data: invoiceGeneration, error: invoiceGenError } =
        await billzpaddi
          .from("invoice_generations")
          .select("invoice_count")
          .eq("user_id", user?.user_id)
          .single();

      if (invoiceGenError && invoiceGenError.code !== "PGRST116") {
        throw invoiceGenError;
      }

      let currentCount = invoiceGeneration?.invoice_count || 0;

      if (currentCount < FREE_INVOICE_LIMIT && invoice.currency === "NGN") {
        // Free invoice

        const { error: txError } = await billzpaddi
          .from("transactions")
          .insert({
            user_id: user?.user_id,
            email: user?.email,
            amount: 0,
            type: "debit",
            description: `Invoice generation fee (free)`,
            status: "completed",
            reference: uniqueRequestId,
          });

        if (txError) throw txError;

        if (invoiceGeneration) {
          // Update count
          const { error: updateError } = await billzpaddi
            .from("invoice_generations")
            .update({ invoice_count: currentCount + 1 })
            .eq("user_id", user?.user_id);

          if (updateError) throw updateError;
        } else {
          // Insert new record with count = 1
          const { error: insertError } = await billzpaddi
            .from("invoice_generations")
            .insert({
              user_id: user?.user_id,
              invoice_count: 1,
            });

          if (insertError) throw insertError;
        }

        setInvoiceCount(currentCount + 1);
        return true;
      }

      // Paid invoice: check wallet balance
      const { data: wallet, error: walletError } = await billzpaddi
        .from("wallets")
        .select("balance")
        .eq("user_id", user?.user_id)
        .single();

      if (walletError) throw walletError;

      if (wallet.balance < processingFee) {
        toast.error("Insufficient balance");
        return false;
      }

      // Deduct fee from wallet
      const { error: updateWalletError } = await billzpaddi
        .from("wallets")
        .update({ balance: wallet.balance - processingFee })
        .eq("user_id", user?.user_id);

      if (updateWalletError) throw updateWalletError;

      // Record transaction with fee
      const { error: txError } = await billzpaddi.from("transactions").insert({
        user_id: user?.user_id,
        email: user?.email,
        amount: processingFee,
        type: "debit",
        description: "Invoice generation fee",
        status: "completed",
        reference: uniqueRequestId,
      });

      if (txError) throw txError;

      // Update invoice generation count (increment)
      if (invoiceGeneration) {
        const { error: updateError } = await billzpaddi
          .from("invoice_generations")
          .update({ invoice_count: currentCount + 1 })
          .eq("user_id", user?.user_id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await billzpaddi
          .from("invoice_generations")
          .insert({
            user_id: user?.user_id,
            invoice_count: 1,
          });

        if (insertError) throw insertError;
      }

      setInvoiceCount(currentCount + 1);
      return true;
    } catch (error) {
      toast.error("Payment processing failed");
      console.error(error);
      return false;
    } finally {
      fetchWallet();
      getUniqueRequestId();
      fetchTransactions();
      setIsGenerating(false);
    }
  };

  const generatePDF = async () => {
    const feePaid = await deductFee();
    if (!feePaid) {
      return;
    }

    setIsGenerating(true);

    try {
      const pdfDoc = await PDFDocument.create();

      // Register fontkit before embedding fonts
      pdfDoc.registerFontkit(fontkit);

      // Ensure font is properly loaded

      const page = pdfDoc.addPage([595, 842]); // A4 size

      // Load a custom Unicode font (replace with your actual font path)
      const fontUrl = "/fonts/NotoSans-VariableFont_wdth,wght.ttf"; // Place this in your public folder
      const fontResponse = await fetch(fontUrl);
      const fontBytes = await fontResponse.arrayBuffer();

      const font = await pdfDoc.embedFont(fontBytes);
      const boldFont = await pdfDoc.embedFont(fontBytes, { bold: true });

      console.log("Font embedded:", font !== undefined); // Should log true

      // Define constants for consistent spacing
      const pageMargin = 40;
      const contentWidth = page.getWidth() - 2 * pageMargin;
      let currentY = page.getHeight() - pageMargin;

      // Function to draw text with consistent line spacing
      const drawTextWithSpacing = (
        text,
        x,
        size,
        font,
        lineHeight = 12,
        maxWidth = contentWidth
      ) => {
        page.drawText(text, {
          x: pageMargin + x,
          y: currentY,
          size,
          font,
          maxWidth,
        });
        currentY -= lineHeight;
      };

      // Header section
      const headerHeight = 100;
      const headerY = page.getHeight() - pageMargin - headerHeight;

      // Invoice title and company name
      currentY = headerY + headerHeight - 20;
      drawTextWithSpacing("INVOICE", 0, 24, boldFont, 30);
      drawTextWithSpacing(
        invoice.vendorName || "Your Business Name",
        0,
        14,
        boldFont,
        18
      );
      drawTextWithSpacing(
        `Invoice #: ${invoice.invoiceNumber}`,
        0,
        10,
        font,
        15
      );
      drawTextWithSpacing(
        `Date: ${new Date(invoice.invoiceDate).toLocaleDateString()}`,
        0,
        10,
        font,
        15
      );

      // Logo on the right
      if (invoice.vendorLogo) {
        try {
          let logoImage;
          if (invoice.vendorLogo.startsWith("data:image/png")) {
            logoImage = await pdfDoc.embedPng(invoice.vendorLogo);
          } else if (
            invoice.vendorLogo.startsWith("data:image/jpeg") ||
            invoice.vendorLogo.startsWith("data:image/jpg")
          ) {
            logoImage = await pdfDoc.embedJpg(invoice.vendorLogo);
          } else {
            throw new Error("Unsupported logo format");
          }

          const logoWidth = 100;
          const logoHeight = 35;
          const logoX = page.getWidth() - pageMargin - logoWidth;
          const logoY = headerY + headerHeight - logoHeight - 10;

          page.drawImage(logoImage, {
            x: logoX,
            y: logoY,
            width: logoWidth,
            height: logoHeight,
          });
        } catch (e) {
          console.error("Error embedding logo:", e);
        }
      }

      // Horizontal line after header
      currentY = headerY;
      page.drawLine({
        start: { x: pageMargin, y: currentY },
        end: { x: page.getWidth() - pageMargin, y: currentY },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.8),
      });

      // Customer Info section with background
      const customerInfoHeight = invoice.customerEmail ? 60 : 45; // Adjust height based on content
      const customerInfoY = currentY - customerInfoHeight;

      // Light gray background for customer info
      page.drawRectangle({
        x: pageMargin,
        y: customerInfoY,
        width: contentWidth,
        height: customerInfoHeight,
        color: rgb(0.97, 0.97, 0.97), // Very light gray
        borderWidth: 0,
      });

      // Customer info text
      currentY = customerInfoY + customerInfoHeight - 15; // Position text inside box
      drawTextWithSpacing("BILL TO:", 0, 12, boldFont, 15);
      drawTextWithSpacing(
        invoice.customerName || "Customer Name",
        0,
        10,
        font,
        15
      );
      if (invoice.customerEmail) {
        drawTextWithSpacing(invoice.customerEmail, 0, 10, font, 15);
      }

      // Optional: Add subtle border at bottom
      page.drawLine({
        start: { x: pageMargin, y: customerInfoY },
        end: { x: page.getWidth() - pageMargin, y: customerInfoY },
        thickness: 1,
        color: rgb(0.9, 0.9, 0.9), // Light gray border
      });

      currentY = customerInfoY - 15; // Adjust position for next section

      // Horizontal line before items
      currentY -= 20;
      page.drawLine({
        start: { x: pageMargin, y: currentY },
        end: { x: page.getWidth() - pageMargin, y: currentY },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.8),
      });

      // Items table header
      currentY -= 20;
      const itemX = 0;
      const qtyX = contentWidth * 0.5; // Adjusted column positions
      const priceX = contentWidth * 0.7;
      const amountX = contentWidth * 0.85;

      page.drawText("Description", {
        x: pageMargin + itemX,
        y: currentY,
        size: 10,
        font: boldFont,
      });
      page.drawText("Qty", {
        x: pageMargin + qtyX,
        y: currentY,
        size: 10,
        font: boldFont,
      });
      page.drawText("Price", {
        x: pageMargin + priceX,
        y: currentY,
        size: 10,
        font: boldFont,
      });
      page.drawText("Amount", {
        x: pageMargin + amountX,
        y: currentY,
        size: 10,
        font: boldFont,
        width: contentWidth - amountX,
        textAlign: "right",
      });

      currentY -= 10;
      page.drawLine({
        start: { x: pageMargin, y: currentY },
        end: { x: page.getWidth() - pageMargin, y: currentY },
        thickness: 0.5,
        color: rgb(0.8, 0.8, 0.8),
      });

      // Items rows
      currentY -= 15;
      invoice.items.forEach((item) => {
        drawTextWithSpacing(item.name, itemX, 10, font, 18, qtyX - itemX - 10);
        page.drawText(item.quantity.toString(), {
          x: pageMargin + qtyX,
          y: currentY + 3,
          size: 10,
          font,
        });
        page.drawText(
          `${invoice.currencySymbol || "N/A"} ${total.toLocaleString("en-NG")}`,
          {
            x: pageMargin + priceX,
            y: currentY + 3,
            size: 10,
            font,
          }
        );
        page.drawText(
          `${invoice.currencySymbol} ${(
            item.quantity * item.price
          ).toLocaleString("en-NG")}`,
          {
            x: pageMargin + amountX,
            y: currentY + 3,
            size: 10,
            font: boldFont,
            width: contentWidth - amountX - 10,
            textAlign: "right",
          }
        );
        currentY -= 20;
      });

      // Horizontal line after items
      currentY -= 10;
      page.drawLine({
        start: { x: pageMargin, y: currentY },
        end: { x: page.getWidth() - pageMargin, y: currentY },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.8),
      });

      // Totals section
      const totalsX = contentWidth * 0.6;
      const totalsValueX = contentWidth * 0.85;

      currentY -= 20;
      page.drawText("Subtotal:", {
        x: pageMargin + totalsX,
        y: currentY,
        size: 10,
        font,
      });
      page.drawText(
        `${invoice.currencySymbol || "₦"} ${subtotal.toLocaleString("en-NG")}`,
        {
          x: pageMargin + totalsValueX,
          y: currentY,
          size: 10,
          font: boldFont,
          width: contentWidth - totalsValueX - 10,
          textAlign: "right",
        }
      );

      currentY -= 20;
      page.drawText(`Tax (${invoice.taxRate}%):`, {
        x: pageMargin + totalsX,
        y: currentY,
        size: 10,
        font,
      });
      page.drawText(
        `${invoice.currencySymbol || "₦"} ${taxAmount.toLocaleString("en-NG")}`,
        {
          x: pageMargin + totalsValueX,
          y: currentY,
          size: 10,
          font: boldFont,
          width: contentWidth - totalsValueX - 10,
          textAlign: "right",
        }
      );

      currentY -= 20;
      page.drawText(`Discount (${invoice.discount}%):`, {
        x: pageMargin + totalsX,
        y: currentY,
        size: 10,
        font,
      });
      page.drawText(
        `${invoice.currencySymbol || "₦"} ${discountAmount.toLocaleString(
          "en-NG"
        )}`,
        {
          x: pageMargin + totalsValueX,
          y: currentY,
          size: 10,
          font: boldFont,
          width: contentWidth - totalsValueX - 10,
          textAlign: "right",
        }
      );

      currentY -= 20;
      page.drawText("Total:", {
        x: pageMargin + totalsX,
        y: currentY,
        size: 12,
        font: boldFont,
      });
      page.drawText(
        `${invoice.currencySymbol || "₦"} ${total.toLocaleString("en-NG")}`,
        {
          x: pageMargin + totalsValueX,
          y: currentY,
          size: 12,
          font: boldFont,
          width: contentWidth - totalsValueX - 10,
          textAlign: "right",
        }
      );

      // Notes section
      currentY -= 40;
      if (invoice.notes) {
        drawTextWithSpacing("Notes:", 0, 10, boldFont, 15);
        const notesLines = invoice.notes.match(/.{1,80}/g);
        if (notesLines) {
          notesLines.forEach((line) => {
            drawTextWithSpacing(line, 0, 10, font, 15);
          });
        }
      }

      // Footer section
      currentY -= 40;
      const centerText = (text, fontSize, y, useBold = true) => {
        const textWidth = (useBold ? boldFont : font).widthOfTextAtSize(
          text,
          fontSize
        );
        page.drawText(text, {
          x: pageMargin + (contentWidth - textWidth) / 2,
          y,
          size: fontSize,
          font: useBold ? boldFont : font,
        });
      };

      // Footer section - Clean Professional Style
      currentY -= 40; // Space before footer

      // Modified centerText function call with color
      const thankYouText = "Thank you for your business!";
      page.drawText(thankYouText, {
        x:
          pageMargin +
          (contentWidth - boldFont.widthOfTextAtSize(thankYouText, 12)) / 2,
        y: currentY,
        size: 12,
        font: boldFont,
        color: rgb(0.4, 0.4, 0.4),
      });
      currentY -= 25;

      // Contact box with subtle styling
      const contactBoxHeight = 60;
      const contactBoxY = currentY - contactBoxHeight - 20; // Added extra margin

      // 1. First draw the background
      page.drawRectangle({
        x: pageMargin,
        y: contactBoxY,
        width: contentWidth,
        height: contactBoxHeight,
        color: rgb(0.97, 0.97, 0.97),
        borderWidth: 0,
      });

      // 2. Draw the header
      page.drawText("Contact Information", {
        x: pageMargin + 15,
        y: contactBoxY + contactBoxHeight - 20, // Adjusted position
        size: 11, // Slightly larger
        font: boldFont,
        color: rgb(0.2, 0.2, 0.2), // Darker for better visibility
      });

      // 3. Draw contact details
      const contactDetails = [
        { label: "Email:", value: invoice.vendorEmail || "Not provided" },
        { label: "Phone:", value: invoice.vendorPhone || "Not provided" },
      ];

      let detailY = contactBoxY + contactBoxHeight - 40; // Start position for details

      contactDetails.forEach((detail) => {
        // Draw label
        page.drawText(detail.label, {
          x: pageMargin + 20,
          y: detailY,
          size: 10,
          font: boldFont,
          color: rgb(0.3, 0.3, 0.3),
        });

        // Draw value
        page.drawText(detail.value, {
          x: pageMargin + 70, // Increased from 50 for better spacing
          y: detailY,
          size: 10,
          font: font,
          color: rgb(0.3, 0.3, 0.3),
        });

        detailY -= 18; // Move down for next line
      });

      // 4. Draw border (optional)
      page.drawLine({
        start: { x: pageMargin, y: contactBoxY + contactBoxHeight },
        end: {
          x: page.getWidth() - pageMargin,
          y: contactBoxY + contactBoxHeight,
        },
        thickness: 1,
        color: rgb(0.9, 0.9, 0.9),
      });

      // Update currentY for any following content
      currentY = contactBoxY - 15;

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);

      toast.success("Invoice Generated");
      setBlob(blob);
    } catch (error) {
      toast.error("Error generating Invoice");
      console.error(error);
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadInvoice = async () => {
    const toastD = toast.loading("Downloading Invoice...");

    if (!blob) return;

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `invoice_${invoice.invoiceNumber}.pdf`;
    link.click();

    toast.dismiss(toastD);
  };

  const sendEmail = async (email) => {
    if (!email) {
      toast.error("No email address provided");
      return false;
    }

    try {
      if (!blob) return false;

      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(blob);

      return new Promise((resolve) => {
        reader.onloadend = async () => {
          const base64data = reader.result.split(",")[1];

          // Send to your email API endpoint
          const response = await fetch("/api/send-invoice", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: email,
              subject: `Invoice ${invoice.invoiceNumber}`,
              pdf: base64data,
              invoiceData: invoice,
            }),
          });

          if (response.ok) {
            toast.success("Invoice sent successfully!");
            downloadInvoice();
            resolve(true);
          } else {
            toast.error("Failed to send invoice");
            resolve(false);
          }
        };
      });
    } catch (error) {
      toast.error("Error sending email");
      console.error(error);
      return false;
    }
  };

  if (!user || isLoading) {
    return (
      <div className="flex items-center justify-center h-[30rem]">
        <img
          src="/icons/loader-white.svg"
          alt="Loading..."
          className="w-20 h-20"
        />
      </div>
    );
  }

  return (
    <div>
      <section className="px-4 py-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 uppercase">
          Generate Invoice
        </h1>

        <div className="max-w-4xl mx-auto">
          {/* Invoice Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 text-white">
            {/* Vendor Info */}
            <div className="bg-gray-800 p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Your Business Info</h2>
              <div className="mb-4">
                <label className="block mb-2">Business Name</label>
                <input
                  type="text"
                  name="vendorName"
                  value={invoice.vendorName}
                  onChange={handleInputChange || ""}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 outline-none"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2">Email</label>
                <input
                  type="email"
                  name="vendorEmail"
                  value={invoice.vendorEmail || ""}
                  onChange={handleInputChange}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 outline-none"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2">Phone</label>
                <input
                  type="tel"
                  name="vendorPhone"
                  value={invoice.vendorPhone || ""}
                  onChange={handleInputChange}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 outline-none"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2">Logo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="w-full text-sm cursor-pointer text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded file:border-0
              file:text-sm file:font-semibold
              file:bg-gray-50 file:text-gray-700
              hover:file:bg-gray-100"
                />
                {logoPreview && (
                  <div className="mt-2 flex justify-start">
                    <img
                      src={logoPreview}
                      alt="Logo Preview"
                      className="max-h-13 max-w-full object-contain p-1 rounded-md"
                      style={{
                        maxWidth: "150px", // Limits width on mobile
                        height: "auto", // Maintains aspect ratio
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Customer Info */}
            <div className="bg-gray-800 p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Customer Info</h2>
              <div className="mb-4">
                <label className="block mb-2">Customer Name</label>
                <input
                  type="text"
                  name="customerName"
                  value={invoice.customerName || ""}
                  onChange={handleInputChange}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 outline-none"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2">Customer Email</label>
                <input
                  type="email"
                  name="customerEmail"
                  value={invoice.customerEmail || ""}
                  onChange={handleInputChange}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Invoice Items */}
          <div className="bg-gray-800 p-6 rounded-lg shadow mb-8 text-white">
            <h2 className="text-xl font-semibold mb-4">Items</h2>
            {invoice.items.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-4 gap-4 mb-4 items-end bg-gray-900 rounded-md p-2"
              >
                <div className="col-span-4 md:col-span-1">
                  <label className="block mb-2">Item Name</label>
                  <input
                    type="text"
                    value={item.name || ""}
                    onChange={(e) =>
                      handleItemChange(index, "name", e.target.value)
                    }
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 outline-none"
                    required
                  />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block mb-2">Qty</label>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity || ""}
                    onChange={(e) =>
                      handleItemChange(index, "quantity", e.target.value)
                    }
                    className="w-full bg-gray-700 border uppercase border-gray-600 rounded-lg px-4 py-2 outline-none"
                    required
                  />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block mb-2">Price (₦)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.price || ""}
                    onChange={(e) =>
                      handleItemChange(index, "price", e.target.value)
                    }
                    className="w-full bg-gray-700 border uppercase border-gray-600 rounded-lg px-4 py-2 outline-none"
                    required
                  />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block mb-2">Total</label>
                  <div className="px-2">
                    {invoice?.currencySymbol}
                    {(item.quantity * item.price).toLocaleString("en-NG")}
                  </div>
                </div>
                <div className="col-span-1">
                  {invoice.items.length > 1 && (
                    <button
                      onClick={() => removeItem(index)}
                      className="p-2 text-red-500 hover:text-red-700 cursor-pointer"
                    >
                      <FaTrash />
                    </button>
                  )}
                </div>
              </div>
            ))}
            <button
              onClick={addItem}
              className="flex items-center gap-2 cursor-pointer text-gray-200 hover:text-gray-300"
            >
              <FaPlus /> Add Item
            </button>
          </div>

          {/* Invoice Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 text-white">
            <div className="bg-gray-800 p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Invoice Details</h2>
              <div className="mb-4">
                <label className="block mb-2">Currency</label>
                <CurrencySelector
                  selectedCurrency={invoice.currency}
                  onSelect={handleCurrencyChange}
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2">Invoice Number</label>
                <input
                  type="text"
                  name="invoiceNumber"
                  value={invoice.invoiceNumber || ""}
                  onChange={handleInputChange}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 outline-none"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2">Date</label>
                <input
                  type="date"
                  name="invoiceDate"
                  value={invoice.invoiceDate || ""}
                  onChange={handleInputChange}
                  className="w-full bg-gray-700 border uppercase border-gray-600 rounded-lg px-4 py-2 outline-none"
                />
              </div>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Tax & Discount</h2>
              <div className="mb-4">
                <label className="block mb-2">Tax Rate (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  name="taxRate"
                  value={invoice.taxRate || ""}
                  onChange={handleInputChange}
                  className="w-full bg-gray-700 border uppercase border-gray-600 rounded-lg px-4 py-2 outline-none"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2">Discount (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  name="discount"
                  value={invoice.discount || ""}
                  onChange={handleInputChange}
                  className="w-full bg-gray-700 border uppercase border-gray-600 rounded-lg px-4 py-2 outline-none"
                />
              </div>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Summary</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>
                    {invoice?.currencySymbol}
                    {subtotal.toLocaleString("en-NG")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Tax ({invoice.taxRate}%):</span>
                  <span>
                    {invoice?.currencySymbol}
                    {taxAmount.toLocaleString("en-NG")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Discount ({invoice.discount}%):</span>
                  <span>
                    -{invoice?.currencySymbol}
                    {discountAmount.toLocaleString("en-NG")}
                  </span>
                </div>
                <div className="flex justify-between font-bold border-t pt-2 mt-2">
                  <span>Total:</span>
                  <span>
                    {invoice?.currencySymbol}
                    {total.toLocaleString("en-NG")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-gray-800 p-6 rounded-lg shadow mb-8 text-white">
            <h2 className="text-xl font-semibold mb-4">Notes</h2>
            <textarea
              name="notes"
              value={invoice.notes || ""}
              onChange={handleInputChange}
              className="w-full p-2 bg-gray-700 border-gray-600 border rounded h-24 outline-none"
              placeholder="Additional notes or terms..."
            />
          </div>

          {/* Fee and Total Display */}
          <div className="bg-gray-800 p-3 rounded-md space-y-1">
            <p className="text-gray-300 text-sm mb-2">
              Wallet Balance: ₦
              {wallet?.balance?.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }) ?? "0.00"}
            </p>
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">Processing Fee:</span>
              <span className="text-white text-sm">
                {invoice.currency !== "NGN" ? (
                  <>₦{processingFee.toFixed(2)}</>
                ) : (
                  "₦0"
                )}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex pt-7 flex-wrap gap-4 w-full">
            <div className="flex flex-col w-full">
              <button
                onClick={generatePDF}
                disabled={isGenerating}
                className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 cursor-pointer text-white px-4 py-3 rounded disabled:opacity-50"
              >
                {isGenerating ? (
                  "Generating Invoice..."
                ) : (
                  <>Generate Invoice </>
                )}
              </button>
            </div>
          </div>

          {/* Preview */}
          {previewUrl && (
            <div className="mt-8">
              <div className="flex justify-end pb-5 gap-4">
                <button
                  onClick={downloadInvoice}
                  disabled={isGenerating}
                  className="flex items-center gap-2 cursor-pointer bg-green-500 hover:bg-green-600 text-white px-10 py-3 rounded disabled:opacity-50"
                >
                  <FaDownload /> Download Invoice (PDF)
                </button>
              </div>
              <h2 className="text-xl font-semibold mb-4">Your Invoice</h2>
              <iframe
                src={previewUrl}
                className="w-full h-[600px] border rounded-lg"
                title="Invoice Preview"
              />
              {/* Actions */}
              <div className="flex flex-wrap gap-4 justify-end pt-10">
                <div className="flex gap-4">
                  <button
                    onClick={downloadInvoice}
                    disabled={isGenerating}
                    className="flex items-center gap-2 cursor-pointer bg-green-500 hover:bg-green-600 text-white px-10 py-3 rounded disabled:opacity-50"
                  >
                    <FaDownload /> Download Invoice (PDF)
                  </button>
                </div>
                <div className="flex flex-col gap-1">
                  {false && (
                    <>
                      <button
                        onClick={() => sendEmail(invoice.customerEmail)}
                        disabled={isGenerating}
                        className="flex items-center gap-2 cursor-pointer bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded disabled:opacity-50"
                      >
                        <FaEnvelope /> Send to Customer
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
