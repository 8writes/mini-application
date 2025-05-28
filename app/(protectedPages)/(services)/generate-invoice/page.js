"use client";
import { useState, useEffect } from "react";
import { useGlobalContext } from "@/context/GlobalContext";
import { FaDownload, FaEnvelope, FaEye, FaPlus, FaTrash } from "react-icons/fa";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { toast } from "react-toastify";
import { billzpaddi } from "@/lib/client";
import { HiDocumentText } from "react-icons/hi";
import { useGlobalContextData } from "@/context/GlobalContextData";

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
      const FREE_INVOICE_LIMIT = 5;
      const FEE = 25;

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

      if (currentCount < FREE_INVOICE_LIMIT) {
        // Free invoice

        const { error: txError } = await billzpaddi
          .from("transactions")
          .insert({
            user_id: user?.user_id,
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

      if (wallet.balance < FEE) {
        toast.error("Insufficient balance");
        return false;
      }

      // Deduct fee from wallet
      const { error: updateWalletError } = await billzpaddi
        .from("wallets")
        .update({ balance: wallet.balance - FEE })
        .eq("user_id", user?.user_id);

      if (updateWalletError) throw updateWalletError;

      // Record transaction with fee
      const { error: txError } = await billzpaddi.from("transactions").insert({
        user_id: user?.user_id,
        amount: FEE,
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
      const page = pdfDoc.addPage([595, 842]); // A4 size

      // Embed fonts - Using Helvetica Bold for headings and regular for text
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // Draw borders
      page.drawRectangle({
        x: 40,
        y: 40,
        width: 515,
        height: 762,
        borderWidth: 1,
        borderColor: rgb(0.8, 0.8, 0.8),
        color: rgb(1, 1, 1),
      });

      // Header section
      page.drawText("INVOICE", {
        x: 50,
        y: 750,
        size: 24,
        font: boldFont,
      });

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

          // ✅ Fixed size
          const logoWidth = 90;
          const logoHeight = 30;

          page.drawImage(logoImage, {
            x: page.getWidth() - logoWidth - 70, // Right-aligned with padding
            y: page.getHeight() - logoHeight - 65, // Consistent vertical position
            width: logoWidth,
            height: logoHeight,
          });
        } catch (e) {
          console.error("Error embedding logo:", e);
        }
      }

      // Vendor info
      page.drawText(invoice.vendorName || "Your Business Name", {
        x: 50,
        y: 700,
        size: 14,
        font: boldFont,
      });

      // Invoice details
      page.drawText(`Invoice #: ${invoice.invoiceNumber}`, {
        x: 50,
        y: 670,
        size: 10,
        font,
      });
      page.drawText(
        `Date: ${new Date(invoice.invoiceDate).toLocaleDateString()}`,
        {
          x: 50,
          y: 650,
          size: 10,
          font,
        }
      );

      // Customer info
      page.drawText("BILL TO:", {
        x: 50,
        y: 620,
        size: 12,
        font: boldFont,
      });
      page.drawText(invoice.customerName || "Customer Name", {
        x: 50,
        y: 600,
        size: 10,
        font,
      });
      page.drawText(invoice.customerEmail || "", {
        x: 50,
        y: 580,
        size: 10,
        font,
      });

      // Line separator
      page.drawLine({
        start: { x: 50, y: 560 },
        end: { x: 545, y: 560 },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.8),
      });

      // Items table header
      page.drawText("Description", {
        x: 50,
        y: 540,
        size: 10,
        font: boldFont,
      });
      page.drawText("Qty", {
        x: 350,
        y: 540,
        size: 10,
        font: boldFont,
      });
      page.drawText("Price", {
        x: 400,
        y: 540,
        size: 10,
        font: boldFont,
      });
      page.drawText("Amount", {
        x: 480,
        y: 540,
        size: 10,
        font: boldFont,
      });

      // Items rows
      let yPosition = 520;
      invoice.items.forEach((item) => {
        page.drawText(item.name, {
          x: 50,
          y: yPosition,
          size: 10,
          font,
        });
        page.drawText(item.quantity.toString(), {
          x: 350,
          y: yPosition,
          size: 10,
          font,
        });
        page.drawText(`NGN ${item.price.toLocaleString("en-NG")}`, {
          x: 400,
          y: yPosition,
          size: 10,
          font,
        });
        page.drawText(
          `NGN ${(item.quantity * item.price).toLocaleString("en-NG")}`,
          {
            x: 480,
            y: yPosition,
            size: 10,
            font,
          }
        );
        yPosition -= 20;
      });

      // Line separator
      yPosition -= 10;
      page.drawLine({
        start: { x: 50, y: yPosition },
        end: { x: 545, y: yPosition },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.8),
      });

      // Totals
      yPosition -= 20;
      page.drawText("Subtotal:", {
        x: 400,
        y: yPosition,
        size: 10,
        font,
      });
      page.drawText(`NGN ${subtotal.toLocaleString("en-NG")}`, {
        x: 480,
        y: yPosition,
        size: 10,
        font: boldFont,
      });

      yPosition -= 20;
      page.drawText(`Tax (${invoice.taxRate}%):`, {
        x: 400,
        y: yPosition,
        size: 10,
        font,
      });
      page.drawText(`NGN ${taxAmount.toLocaleString("en-NG")}`, {
        x: 480,
        y: yPosition,
        size: 10,
        font: boldFont,
      });

      yPosition -= 20;
      page.drawText(`Discount (${invoice.discount}%):`, {
        x: 400,
        y: yPosition,
        size: 10,
        font,
      });
      page.drawText(`NGN ${discountAmount.toLocaleString("en-NG")}`, {
        x: 480,
        y: yPosition,
        size: 10,
        font: boldFont,
      });

      yPosition -= 20;
      page.drawText("Total:", {
        x: 400,
        y: yPosition,
        size: 12,
        font: boldFont,
      });
      page.drawText(`NGN ${total.toLocaleString("en-NG")}`, {
        x: 480,
        y: yPosition,
        size: 12,
        font: boldFont,
      });

      // Notes
      yPosition -= 40;
      if (invoice.notes) {
        page.drawText("Notes:", {
          x: 50,
          y: yPosition,
          size: 10,
          font: boldFont,
        });
        page.drawText(invoice.notes, {
          x: 50,
          y: yPosition - 20,
          size: 10,
          font,
          maxWidth: 500,
        });
        yPosition -= 40;
      }

      // Line separator
      yPosition -= 10;
      page.drawLine({
        start: { x: 50, y: yPosition },
        end: { x: 545, y: yPosition },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.8),
      });

      // Centered Thank you section
      const thankYouText = "";
      const contactText = "Please contact us with any questions:";
      const emailText = `Email: ${user.email}`;
      const phoneText = `Phone: ${user.phone || "N/A"}`;

      // Calculate center positions
      const centerText = (text, fontSize, y, useBold = true) => {
        const textWidth = (useBold ? boldFont : font).widthOfTextAtSize(
          text,
          fontSize
        );
        page.drawText(text, {
          x: 40 + (515 - textWidth) / 2,
          y,
          size: fontSize,
          font: useBold ? boldFont : font,
        });
      };

      yPosition -= 60;
      centerText(thankYouText, 14, yPosition);

      yPosition -= 30;
      centerText(contactText, 10, yPosition, false);

      yPosition -= 20;
      centerText(emailText, 10, yPosition, false);

      yPosition -= 15;
      centerText(phoneText, 10, yPosition, false);

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 text-gray-800">
            {/* Vendor Info */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Your Business Info</h2>
              <div className="mb-4">
                <label className="block mb-2">Business Name</label>
                <input
                  type="text"
                  name="vendorName"
                  value={invoice.vendorName}
                  onChange={handleInputChange || ""}
                  className="w-full p-2 border rounded outline-none"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={invoice.email || ""}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded outline-none"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={invoice.phone || ""}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
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
                      className="max-h-20 max-w-full object-contain border p-1 rounded-md"
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
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Customer Info</h2>
              <div className="mb-4">
                <label className="block mb-2">Customer Name</label>
                <input
                  type="text"
                  name="customerName"
                  value={invoice.customerName || ""}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
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
                  className="w-full p-2 border rounded outline-none"
                />
              </div>
            </div>
          </div>

          {/* Invoice Items */}
          <div className="bg-white p-6 rounded-lg shadow mb-8 text-gray-800">
            <h2 className="text-xl font-semibold mb-4">Items</h2>
            {invoice.items.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-4 gap-4 mb-4 items-end bg-gray-200 rounded-md p-2"
              >
                <div className="col-span-4 md:col-span-1">
                  <label className="block mb-2">Item Name</label>
                  <input
                    type="text"
                    value={item.name || ""}
                    onChange={(e) =>
                      handleItemChange(index, "name", e.target.value)
                    }
                    className="w-full p-2 border rounded outline-none"
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
                    className="w-full p-2 border rounded outline-none"
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
                    className="w-full p-2 border rounded outline-none"
                    required
                  />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block mb-2">Total</label>
                  <div className="px-2">
                    ₦{(item.quantity * item.price).toLocaleString("en-NG")}
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
              className="flex items-center gap-2 cursor-pointer text-gray-700 hover:text-gray-800"
            >
              <FaPlus /> Add Item
            </button>
          </div>

          {/* Invoice Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 text-gray-800">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Invoice Details</h2>
              <div className="mb-4">
                <label className="block mb-2">Invoice Number</label>
                <input
                  type="text"
                  name="invoiceNumber"
                  value={invoice.invoiceNumber || ""}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded outline-none"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2">Date</label>
                <input
                  type="date"
                  name="invoiceDate"
                  value={invoice.invoiceDate || ""}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded outline-none"
                />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
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
                  className="w-full p-2 border rounded outline-none"
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
                  className="w-full p-2 border rounded outline-none"
                />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Summary</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₦{subtotal.toLocaleString("en-NG")}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax ({invoice.taxRate}%):</span>
                  <span>₦{taxAmount.toLocaleString("en-NG")}</span>
                </div>
                <div className="flex justify-between">
                  <span>Discount ({invoice.discount}%):</span>
                  <span>-₦{discountAmount.toLocaleString("en-NG")}</span>
                </div>
                <div className="flex justify-between font-bold border-t pt-2 mt-2">
                  <span>Total:</span>
                  <span>₦{total.toLocaleString("en-NG")}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white p-6 rounded-lg shadow mb-8 text-gray-800">
            <h2 className="text-xl font-semibold mb-4">Notes</h2>
            <textarea
              name="notes"
              value={invoice.notes || ""}
              onChange={handleInputChange}
              className="w-full p-2 border rounded h-24 outline-none"
              placeholder="Additional notes or terms..."
            />
            <div className="pt-2 mt-2 text-sm text-green-700 text-center md:text-start">
              {invoiceCount < 2 ? (
                <p>
                  * You can generate {invoiceCount}/2 free invoices then ₦30 per
                  invoice.
                </p>
              ) : (
                <p>* A ₦25 fee will be charged for each invoice generated.</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-4 w-full">
            <div className="flex gap-4 w-full">
              <button
                onClick={generatePDF}
                disabled={isGenerating}
                className="flex items-center justify-center gap-2 w-full bg-gray-800 hover:bg-gray-900 text-white px-4 py-3 cursor-pointer rounded disabled:opacity-50"
              >
                <HiDocumentText className="h-5 w-5" />{" "}
                {isGenerating ? "Generating Invoice..." : "Generate Invoice"}
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
