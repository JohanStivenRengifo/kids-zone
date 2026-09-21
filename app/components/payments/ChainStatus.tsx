interface Props {
  status: string;
  ok: boolean;
}

/** SRP: solo muestra el estado de integridad de la cadena. */
export function ChainStatus({ status, ok }: Props) {
  return <p aria-live="polite" className={ok ? "text-green-700" : "text-red-700"}>{status}</p>;
}
