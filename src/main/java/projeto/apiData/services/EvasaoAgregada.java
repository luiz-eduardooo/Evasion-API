package projeto.apiData.services;

public class EvasaoAgregada {

    private final long totalDesistentes;
    private final long totalIngressantes;

    public EvasaoAgregada(Long totalDesistentes, Long totalIngressantes) {
        this.totalDesistentes = totalDesistentes != null ? totalDesistentes : 0;
        this.totalIngressantes = totalIngressantes != null ? totalIngressantes : 0;
    }


    public double getTaxaEvasao() {
        if (totalIngressantes == 0) return 0.0;
        return (double) totalDesistentes / totalIngressantes * 100;
    }

    public long getTotalDesistentes() { return totalDesistentes; }
    public long getTotalIngressantes() { return totalIngressantes; }
}