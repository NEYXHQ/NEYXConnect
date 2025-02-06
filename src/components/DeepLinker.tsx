import React, { useState } from "react";

const Deeplinker: React.FC = () => {
  const [isEmailMode, setIsEmailMode] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="flex flex-col items-center p-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-300">
        Claim Your NFT
      </h1>

      {/* Show Metamask Button if Email Mode is NOT activated */}
      {!isEmailMode && !submitted && (
        <div className="mt-6">
          <button
            onClick={() =>
              window.open(
                "https://metamask.app.link/dapp/https://myproject.netlify.app/claim-nft",
                "_blank"
              )
            }
            className="bg-neyx-orange text-white py-2 px-4 rounded-md shadow hover:bg-orange-600 transition"
          >
            Open in MetaMask
          </button>
        </div>
      )}

      {/* Show Register with Email Button (Only if Email Mode is NOT active) */}
      {!isEmailMode && !submitted && (
        <div className="mt-4">
          <button
            onClick={() => setIsEmailMode(true)}
            className="bg-gray-500 text-white py-2 px-4 rounded-md shadow hover:bg-gray-600 transition"
          >
            Register with Email
          </button>
        </div>
      )}

      {/* Show Email Form when Register with Email is clicked */}
      {isEmailMode && !submitted && (
        <div className="mt-6 w-full max-w-md">
          <form
            name="email-signup"
            method="POST"
            data-netlify="true"
            onSubmit={handleEmailSubmit}
            className="flex flex-col"
          >
            {/* Hidden Input for Netlify */}
            <input type="hidden" name="form-name" value="email-signup" />

            {/* Email Label & Input */}
            <label htmlFor="email" className="text-gray-700 dark:text-gray-300 mb-2">
              Enter your email:
            </label>
            <input
              type="email"
              name="email"
              id="email"
              placeholder="you@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border border-gray-300 rounded-md p-2 dark:bg-gray-800 dark:text-white"
            />

            {/* Submit Button */}
            <button
              type="submit"
              className="mt-3 bg-neyx-orange text-white py-2 px-4 rounded-md shadow hover:bg-orange-600 transition"
            >
              Register
            </button>
          </form>
          
          {/* Back Button to Return to MetaMask Option */}
          <button
            onClick={() => setIsEmailMode(false)}
            className="mt-4 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition"
          >
            ← Back
          </button>
        </div>
      )}

      {/* Confirmation Message After Submission */}
      {submitted && (
        <p className="text-green-500 mt-4">✅ Email Registered! See you soon.</p>
      )}
    </div>
  );
};

export default Deeplinker;