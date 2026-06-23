package projeto.apiData.dto;
public class RankingItem {
    private final String area;
    private final double taxaEvasao;
    private final long totalIngressantes;
    public RankingItem(String area, Double taxaEvasao, Long totalIngressantes) {
        this.area = area;
        this.taxaEvasao = taxaEvasao != null ? taxaEvasao : 0.0;
        this.totalIngressantes = totalIngressantes != null ? totalIngressantes : 0;
    }
    public String getArea() { return area; }
    public double getTaxaEvasao() { return taxaEvasao; }
    public long getTotalIngressantes() { return totalIngressantes; }
}