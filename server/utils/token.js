
import TokenGenerator from 'uuid-token-generator'

const token = new TokenGenerator(128, TokenGenerator.BASE16)

export default token

