"use client";
import Image from "next/image";
import { GetCIDResponse, PinResponse } from "pinata";
import React, { Suspense, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useParams } from "next/navigation";
import {
  DEFAULT_CONTRACT_INDEX,
  MAX_CONTRACT_EXECUTION_ENERGY,
} from "@/config";
import {
  AccountTransactionType,
  CcdAmount,
  ContractAddress,
  Energy,
  EntrypointName,
  ReceiveName,
} from "@concordium/web-sdk";
import { useWallet } from "@/provider/WalletProvider";
import { moduleSchemaFromBase64 } from "@concordium/react-components";

const page = () => {
  const [nftData, setNftData] = useState<any>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const {
    connection,
    contract,
    moduleSchemaBase64Embedded,
    account,
    connect,
    rpc,
    // fetchCampaign,
  } = useWallet();

  const { CID } = useParams();
  console.log(CID);

  const getNft = async () => {
    try {
      const response = await fetch(`/api/files?CID=${CID}`);
      const data: GetCIDResponse = await response.json();
      console.log(data.data);
      setNftData(data.data);
      toast.success("sucessfull");
    } catch (e) {
      console.log(e);
      toast.error("failed");
    }
  };

  useEffect(() => {
    getNft();
    // getFile();
    // cleanup function
    // return () => {
    //   //
    // };
  }, []);

  console.log(contract);

  const mintNft = async () => {
    if (!account) {
      toast.error("Please connect wallet");
      return;
    }
    function generateRandomTokenId() {
      return Math.floor(10000000 + Math.random() * 90000000);
    }

    const randomTokenId = generateRandomTokenId();

    const params = {
      parameters: {
        owner: {
          Account: [account],
        },
        token_metadata_base_url: `https://amaranth-nearby-leech-573.mypinata.cloud/ipfs/${CID}?`,
        tokens: [randomTokenId.toString()],
      },
      schema: moduleSchemaFromBase64(moduleSchemaBase64Embedded),
    };

    // Sign and send the transaction

    //   setLoadingStates((prev) => ({
    //     ...prev,
    //     [id]: true,
    //   }));

    try {
      const transactionHash = await connection?.signAndSendTransaction(
        account,
        AccountTransactionType.Update,
        {
          amount: CcdAmount.fromCcd(0),
          address: ContractAddress.create(contract?.index, 0),
          receiveName: ReceiveName.create(
            contract?.name,
            EntrypointName.fromString("mint")
          ),
          maxContractExecutionEnergy: Energy.create(
            MAX_CONTRACT_EXECUTION_ENERGY
          ),
        },
        params
      );
      // await completeMint(id);
      return transactionHash;
    } catch (error) {
      console.error("Error completing campaign:", error);
      toast.error("Mint rejected");

      throw error;
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(String(DEFAULT_CONTRACT_INDEX));
      setCopySuccess(true);

      // Reset the copySuccess state after a delay
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };
  return (
    <Suspense fallback={<p>Loading...</p>}>
      {nftData && (
        <div className="p-10  flex justify-center items-center">
          <div>
            <div className="flex justify-between items-center">
              <p className="text-[30px] font-semibold">
                Here is your mint link
              </p>
              {account ? (
                "Connected"
              ) : (
                <button
                  onClick={() => connect?.()}
                  className="px-6 py-3 bg-blue-500  rounded-md text-white"
                >
                  Connect Wallet
                </button>
              )}
            </div>
            <div className="border p-4 bg-white shadow-lg rounded-lg mt-10">
              <div className=" flex  flex-col sm:flex-row items-cente gap-4">
                <Image
                  src={nftData?.display?.url}
                  alt={nftData?.name}
                  width={300}
                  height={300}
                />
                <div className="flex flex-col gap-3 justify-between">
                  <div>
                    <p className="text-[25px] font-medium mb-4 ">
                      {nftData?.name}
                    </p>
                    <p>{nftData?.description}</p>
                  </div>
                  <button
                    onClick={() => mintNft()}
                    className="px-6 py-3 bg-blue-500 w-full max-w-[300px] rounded-md text-white"
                  >
                    Mint Nft
                  </button>
                </div>
              </div>
              <div className="border mt-10 p-3 bg-white shadow-lg rounded  flex flex-col gap-2 sm:flex-row  justify-between items-center">
                <p>
                  Import NFT Contract in your wallet:{" "}
                  {String(DEFAULT_CONTRACT_INDEX)}
                </p>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="bg-blue-500 text-white px-4 py-2 rounded-md font-normal text-sm"
                >
                  {copySuccess ? "Copied!" : "Copy Contract Index"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Suspense>
  );
};

export default page;
