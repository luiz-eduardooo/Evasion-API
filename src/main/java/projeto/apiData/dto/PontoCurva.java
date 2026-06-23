package projeto.apiData.dto;
public class PontoCurva {
    private final int ano;
    private final double taxaEvasao;
    public PontoCurva(Integer ano, Double taxaEvasao) {
        this.ano = ano != null ? ano : 0;
        this.taxaEvasao = taxaEvasao != null ? taxaEvasao : 0.0;
    }
    public int getAno() { return ano; }
    public double getTaxaEvasao() { return taxaEvasao; }
}