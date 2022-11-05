import * as React from "react";
import { Box, Button, Divider, Grid, Typography, Link } from "@mui/material";

import { useInput } from "@/hooks/useInput";
import { useCelo } from "@celo/react-celo";
import { useEffect, useState } from "react";
import { SnackbarAction, SnackbarKey, useSnackbar } from "notistack";
import { truncateAddress } from "@/utils";
// import { Mood } from "@local-contracts/types/Mood";

export function MoodContract({ contractData }) {
  const { kit, address, network, performActions } = useCelo();
  const [MoodValue, setMoodValue] = useState<string | null>(null);
  const [MoodInput, setMoodInput] = useInput({ type: "text" });
  const [contractLink, setContractLink] = useState<string>("");
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const contract = contractData
    ? (new kit.connection.web3.eth.Contract(
        contractData.abi,
        contractData.address
      ) as any)
    : null;

  useEffect(() => {
    if (contractData) {
      setContractLink(`${network.explorer}/address/${contractData.address}`);
    }
  }, [network, contractData]);

  const setMood = async () => {
    try {
      await performActions(async (kit) => {
        const gasLimit = await contract.methods
          .setMood(MoodInput as string)
          .estimateGas();

        const result = await contract.methods
          .setMood(MoodInput as string)
          //@ts-ignore
          .send({ from: address, gasLimit });

        console.log(result);

        const variant = result.status == true ? "success" : "error";
        const url = `${network.explorer}/tx/${result.transactionHash}`;
        const action: SnackbarAction = (key) => (
          <>
            <Link href={url} target="_blank">
              View in Explorer
            </Link>
            <Button
              onClick={() => {
                closeSnackbar(key);
              }}
            >
              X
            </Button>
          </>
        );
        enqueueSnackbar("Transaction processed", {
          variant,
          action,
        });
      });
    } catch (e) {
      enqueueSnackbar(e.message, {variant: 'error'});
      console.log(e);
    }
  };

  const getMood = async () => {
    try {
      const result = await contract.methods.getMood().call();
      setMoodValue(result);
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <Grid sx={{ m: 1 }} container justifyContent="center">
      <Grid item sm={6} xs={12} sx={{ m: 2 }}>
        <Typography variant="h5">Mood Contract:</Typography>
        {contractData ? (
          <Link href={contractLink} target="_blank">
            {truncateAddress(contractData?.address)}
          </Link>
        ) : (
          <Typography>No contract detected for {network.name}</Typography>
        )}
        <Divider sx={{ m: 1 }} />

        <Typography variant="h6">Write Contract</Typography>
        <Box sx={{ m: 1, marginLeft: 0 }}>{setMoodInput}</Box>
        <Button sx={{ m: 1, marginLeft: 0 }} variant="contained" onClick={setMood}>
          Update Mood Contract
        </Button>
        <Divider sx={{ m: 1 }} />

        <Typography variant="h6">Read Contract</Typography>
        <Typography sx={{ m: 1, marginLeft: 0, wordWrap: "break-word" }}>
          Mood Contract Value: {MoodValue}
        </Typography>
        <Button sx={{ m: 1, marginLeft: 0 }} variant="contained" onClick={getMood}>
          Read Mood Contract
        </Button>
      </Grid>
    </Grid>
  );
}
