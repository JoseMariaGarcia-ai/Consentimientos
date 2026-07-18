import forge from 'node-forge'

// Extrae los metadatos públicos (entidad emisora, titular, validez) de un
// certificado .p12/.pfx SIN persistir nunca el certificado descifrado —
// esta función solo se usa en el instante de la subida, con el buffer y la
// contraseña en memoria, para poblar issuer/subject_name/valid_from/
// valid_until antes de cifrar el archivo original para su almacenamiento.
export interface CertificateMetadata {
  issuer: string
  subjectName: string
  validFrom: Date
  validUntil: Date
}

function attrValue(attrs: forge.pki.CertificateField[], shortName: string): string | undefined {
  return attrs.find(a => a.shortName === shortName)?.value as string | undefined
}

function formatDN(attrs: forge.pki.CertificateField[]): string {
  return attrs.map(a => `${a.shortName}=${a.value}`).filter(s => !s.startsWith('undefined=')).join(', ')
}

export function parseCertificateMetadata(fileBuffer: Buffer, password: string): CertificateMetadata {
  let p12Asn1: forge.asn1.Asn1
  try {
    p12Asn1 = forge.asn1.fromDer(forge.util.createBuffer(fileBuffer.toString('binary')))
  } catch {
    throw new Error('El archivo no es un certificado .p12/.pfx válido')
  }

  let p12: forge.pkcs12.Pkcs12Pfx
  try {
    p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, password)
  } catch {
    throw new Error('No se ha podido leer el certificado — revisa que la contraseña sea correcta')
  }

  const certBags = p12.getBags({ bagType: forge.pki.oids.certBag })[forge.pki.oids.certBag] ?? []
  const certBag = certBags.find(b => b.cert)
  if (!certBag?.cert) throw new Error('El archivo no contiene ningún certificado')

  const cert = certBag.cert
  const issuer = attrValue(cert.issuer.attributes, 'O') ?? attrValue(cert.issuer.attributes, 'CN') ?? formatDN(cert.issuer.attributes)
  const subjectName = attrValue(cert.subject.attributes, 'CN') ?? formatDN(cert.subject.attributes)

  return {
    issuer,
    subjectName,
    validFrom: cert.validity.notBefore,
    validUntil: cert.validity.notAfter,
  }
}
