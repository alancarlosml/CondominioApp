<?php

/**
 * ==========================================================
 * API REST - MORADORES
 * ==========================================================
 *
 * GET
 * Lista moradores de uma unidade:
 *
 * /api/moradores.php?id_tbl_condominio=1&unidade=101
 *
 *
 * POST
 * Cadastra morador:
 *
 * multipart/form-data
 *
 *
 * PUT
 * Edita morador:
 *
 * /api/moradores.php?id_tbl_condomino=157
 *
 *
 * DELETE
 * Exclui morador:
 *
 * /api/moradores.php?id_tbl_condomino=157
 *
 * ==========================================================
 */



header("Content-Type: application/json");
//header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, Accept");
header("Access-Control-Max-Age: 86400");

// Tratar preflight request (OPTIONS) - DEVE VIR ANTES DE TUDO
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}



require_once('../conexaoPDO.php');


// ==========================================================
// CONFIGURAÇÕES
// ==========================================================

$limiteFoto = 190 * 1024;

$maxLargura = 800;
$maxAltura = 800;

$pastaFotos = __DIR__ . '/../imagens/';


// ==========================================================
// FUNÇÃO DE RESPOSTA
// ==========================================================

function resposta($status, $dados)
{
    http_response_code($status);

    echo json_encode(
        $dados,
        JSON_UNESCAPED_UNICODE |
        JSON_UNESCAPED_SLASHES |
        JSON_PRETTY_PRINT
    );

    exit;
}


// ==========================================================
// FUNÇÃO PARA GERAR TOKEN
// ==========================================================

function gerarToken($nome, $cpf)
{
    $data = date('Y-m-d H:i:s');

    return md5(
        $data .
        $nome .
        $cpf .
        bin2hex(random_bytes(32))
    );
}


// ==========================================================
// FUNÇÃO PARA PROCESSAR FOTO
// ==========================================================

function processarFoto(
    $arquivo,
    $caminhoDestino,
    $limiteFoto,
    $maxLargura,
    $maxAltura
) {

    if (
        !isset($arquivo) ||
        $arquivo['error'] !== UPLOAD_ERR_OK
    ) {

        throw new Exception(
            "Erro no envio da fotografia."
        );
    }


    // ------------------------------------------
    // Verifica imagem
    // ------------------------------------------

    $info = getimagesize(
        $arquivo['tmp_name']
    );

    if ($info === false) {

        throw new Exception(
            "O arquivo não é uma imagem válida."
        );
    }


    $mime = $info['mime'];


    $permitidos = [
        'image/jpeg',
        'image/png',
        'image/webp'
    ];


    if (!in_array($mime, $permitidos, true)) {

        throw new Exception(
            "Formato de imagem não permitido."
        );
    }


    // ------------------------------------------
    // Cria imagem
    // ------------------------------------------

    switch ($mime) {

        case 'image/jpeg':

            $imagem =
                imagecreatefromjpeg(
                    $arquivo['tmp_name']
                );

            break;


        case 'image/png':

            $imagem =
                imagecreatefrompng(
                    $arquivo['tmp_name']
                );

            break;


        case 'image/webp':

            $imagem =
                imagecreatefromwebp(
                    $arquivo['tmp_name']
                );

            break;


        default:

            throw new Exception(
                "Formato não suportado."
            );
    }


    if (!$imagem) {

        throw new Exception(
            "Não foi possível abrir a imagem."
        );
    }


    // ------------------------------------------
    // Dimensões
    // ------------------------------------------

    $largura =
        imagesx($imagem);

    $altura =
        imagesy($imagem);


    // ------------------------------------------
    // Redimensionamento
    // ------------------------------------------

    $escala = min(

        $maxLargura / $largura,

        $maxAltura / $altura,

        1
    );


    $novaLargura =
        max(
            1,
            (int)($largura * $escala)
        );


    $novaAltura =
        max(
            1,
            (int)($altura * $escala)
        );


    $novaImagem =
        imagecreatetruecolor(
            $novaLargura,
            $novaAltura
        );


    // Fundo branco
    $branco =
        imagecolorallocate(
            $novaImagem,
            255,
            255,
            255
        );


    imagefill(
        $novaImagem,
        0,
        0,
        $branco
    );


    // ------------------------------------------
    // Redimensiona
    // ------------------------------------------

    imagecopyresampled(

        $novaImagem,

        $imagem,

        0,
        0,
        0,
        0,

        $novaLargura,
        $novaAltura,

        $largura,
        $altura
    );


    imagedestroy($imagem);


    // ------------------------------------------
    // Compressão
    // ------------------------------------------

    $qualidade = 90;

    $conteudo = null;

    $tamanhoFinal = 0;

    $sucesso = false;


    while ($qualidade >= 20) {

        ob_start();

        imagejpeg(
            $novaImagem,
            null,
            $qualidade
        );

        $conteudo =
            ob_get_clean();


        $tamanhoFinal =
            strlen($conteudo);


        if (
            $tamanhoFinal <=
            $limiteFoto
        ) {

            $sucesso = true;

            break;
        }


        $qualidade -= 5;
    }


    imagedestroy(
        $novaImagem
    );


    if (!$sucesso) {

        throw new Exception(
            "Não foi possível reduzir a foto para menos de 190 KB."
        );
    }


    // ------------------------------------------
    // Salva arquivo
    // ------------------------------------------

    if (
        file_put_contents(
            $caminhoDestino,
            $conteudo
        ) === false
    ) {

        throw new Exception(
            "Não foi possível salvar a fotografia."
        );
    }


    return [

        "tamanho_kb" =>
            round(
                $tamanhoFinal / 1024,
                2
            ),

        "qualidade" =>
            $qualidade,

        "largura" =>
            $novaLargura,

        "altura" =>
            $novaAltura
    ];
}


// ==========================================================
// MÉTODO
// ==========================================================

$metodo =
    $_SERVER['REQUEST_METHOD'];


// ==========================================================
// GET - LISTAGEM
// ==========================================================

if ($metodo === 'GET') {

    $idCondominio =
        $_GET['id_tbl_condominio'] ?? null;

    $unidade =
        trim($_GET['unidade'] ?? '');


    if (
        empty($idCondominio) ||
        $unidade === ''
    ) {

        resposta(400, [

            "sucesso" => false,

            "mensagem" =>
                "Informe o condomínio e a unidade."
        ]);
    }


    try {

        $sql = "

            SELECT

                id_tbl_condomino,

                nome,

                cpf,

                data_nascimento,

                email,

                telefone,

                obs,

                id_tbl_condominio,

                unidade,

                foto,

                token

            FROM tbl_condomino

            WHERE
                id_tbl_condominio = :condominio

                AND unidade = :unidade

            ORDER BY nome ASC

        ";


        $stmt =
            $PDO->prepare($sql);


        $stmt->bindValue(
            ':condominio',
            $idCondominio,
            PDO::PARAM_INT
        );


        $stmt->bindValue(
            ':unidade',
            $unidade
        );


        $stmt->execute();


        $moradores =
            $stmt->fetchAll(
                PDO::FETCH_ASSOC
            );


        resposta(200, [

            "sucesso" => true,

            "total" =>
                count($moradores),

            "condominio" =>
                (int)$idCondominio,

            "unidade" =>
                $unidade,

            "moradores" =>
                $moradores
        ]);


    } catch (PDOException $e) {

        resposta(500, [

            "sucesso" => false,

            "mensagem" =>
                "Erro ao consultar moradores.",

            "erro" =>
                $e->getMessage()
        ]);
    }
}


// ==========================================================
// POST - CADASTRO
// ==========================================================

if ($metodo === 'POST') {


    // ------------------------------------------
    // Dados
    // ------------------------------------------

    $nome =
        trim($_POST['nome'] ?? '');

    $cpf =
        trim($_POST['cpf'] ?? '');

    $dataNascimento =
        trim(
            $_POST['data_nascimento'] ?? ''
        );

    $email =
        trim($_POST['email'] ?? '');

    $telefone =
        trim($_POST['telefone'] ?? '');

    $obs =
        trim($_POST['obs'] ?? '');

    $idCondominio =
        $_POST['id_tbl_condominio'] ?? null;

    $unidade =
        trim($_POST['unidade'] ?? '');


    // ------------------------------------------
    // Validação
    // ------------------------------------------

    if (

        $nome === '' ||

        $cpf === '' ||

        empty($idCondominio) ||

        $unidade === ''

    ) {

        resposta(400, [

            "sucesso" => false,

            "mensagem" =>
                "Preencha os campos obrigatórios."
        ]);
    }


    // ------------------------------------------
    // Foto opcional - máx. 200KB (processa só se enviada)
    // ------------------------------------------

    $temFoto = isset($_FILES['foto']) && $_FILES['foto']['error'] === UPLOAD_ERR_OK;

    $dadosFoto = null;
    $nomeFoto = null;
    $caminhoFoto = null;


    // ------------------------------------------
    // Verifica CPF
    // ------------------------------------------

    try {

        $sql =
            "SELECT id_tbl_condomino
             FROM tbl_condomino
             WHERE cpf = :cpf
             LIMIT 1";


        $stmt =
            $PDO->prepare($sql);


        $stmt->bindValue(
            ':cpf',
            $cpf
        );


        $stmt->execute();


        if (
            $stmt->fetch()
        ) {

            resposta(409, [

                "sucesso" => false,

                "mensagem" =>
                    "CPF já cadastrado."
            ]);
        }


        // --------------------------------------
        // Token
        // --------------------------------------

        $token =
            gerarToken(
                $nome,
                $cpf
            );


        // --------------------------------------
        // Transação
        // --------------------------------------

        $PDO->beginTransaction();


        // --------------------------------------
        // INSERT
        // --------------------------------------

        $sql = "

            INSERT INTO tbl_condomino

            (
                nome,
                cpf,
                data_nascimento,
                email,
                telefone,
                obs,
                id_tbl_condominio,
                unidade,
                token
            )

            VALUES

            (
                :nome,
                :cpf,
                :data_nascimento,
                :email,
                :telefone,
                :obs,
                :condominio,
                :unidade,
                :token
            )

        ";


        $stmt =
            $PDO->prepare($sql);


        $stmt->bindValue(
            ':nome',
            $nome
        );


        $stmt->bindValue(
            ':cpf',
            $cpf
        );


        if (
            $dataNascimento === ''
        ) {

            $stmt->bindValue(
                ':data_nascimento',
                null,
                PDO::PARAM_NULL
            );

        } else {

            $stmt->bindValue(
                ':data_nascimento',
                $dataNascimento
            );
        }


        $stmt->bindValue(
            ':email',
            $email
        );


        $stmt->bindValue(
            ':telefone',
            $telefone
        );


        $stmt->bindValue(
            ':obs',
            $obs
        );


        $stmt->bindValue(
            ':condominio',
            $idCondominio,
            PDO::PARAM_INT
        );


        $stmt->bindValue(
            ':unidade',
            $unidade
        );


        $stmt->bindValue(
            ':token',
            $token
        );


        $stmt->execute();


        // --------------------------------------
        // ID
        // --------------------------------------

        $idMorador =
            $PDO->lastInsertId();

        // --------------------------------------
        // Processa foto se enviada
        // --------------------------------------

        if ($temFoto) {

            $nomeFoto =
                $idMorador . '.jpg';


            $caminhoFoto =
                $pastaFotos .
                $nomeFoto;


            if (!is_dir($pastaFotos)) {

                mkdir(
                    $pastaFotos,
                    0755,
                    true
                );
            }

            $dadosFoto =
                processarFoto(

                    $_FILES['foto'],

                    $caminhoFoto,

                    $limiteFoto,

                    $maxLargura,

                    $maxAltura
                );

            $sql = "

                UPDATE tbl_condomino

                SET foto = :foto

                WHERE id_tbl_condomino = :id

            ";


            $stmt =
                $PDO->prepare($sql);


            $stmt->bindValue(
                ':foto',
                $nomeFoto
            );


            $stmt->bindValue(
                ':id',
                $idMorador,
                PDO::PARAM_INT
            );


            $stmt->execute();
        }


        // --------------------------------------
        // Commit
        // --------------------------------------

        $PDO->commit();


        resposta(201, [

            "sucesso" => true,

            "mensagem" =>
                "Morador cadastrado com sucesso.",

            "dados" => [

                "id_tbl_condomino" =>
                    (int)$idMorador,

                "nome" =>
                    $nome,

                "cpf" =>
                    $cpf,

                "unidade" =>
                    $unidade,

                "id_tbl_condominio" =>
                    (int)$idCondominio,

                "foto" =>
                    $nomeFoto,

                "token" =>
                    $token,

                "foto_processada" =>
                    $dadosFoto
            ]
        ]);


    } catch (Throwable $e) {


        if (
            $PDO->inTransaction()
        ) {

            $PDO->rollBack();
        }


        if (
            isset($caminhoFoto) &&
            file_exists($caminhoFoto)
        ) {

            @unlink(
                $caminhoFoto
            );
        }


        resposta(500, [

            "sucesso" => false,

            "mensagem" =>
                "Erro ao cadastrar morador.",

            "erro" =>
                $e->getMessage()
        ]);
    }
}


// ==========================================================
// PUT - EDIÇÃO
// ==========================================================

if ($metodo === 'PUT') {


    // ------------------------------------------
    // ID do morador
    // ------------------------------------------

    $idMorador =
        $_GET['id_tbl_condomino'] ?? null;


    if (empty($idMorador)) {

        resposta(400, [

            "sucesso" => false,

            "mensagem" =>
                "Informe o id_tbl_condomino."
        ]);
    }


    // ------------------------------------------
    // Recebe dados (JSON ou multipart c/ foto)
    // ------------------------------------------

    $isMultipart =
        isset($_SERVER['CONTENT_TYPE']) &&
        stripos($_SERVER['CONTENT_TYPE'], 'multipart/form-data') !== false;


    if ($isMultipart) {

        $dados = $_POST;

    } else {

        $dados =
            json_decode(
                file_get_contents(
                    "php://input"
                ),
                true
            );
    }


    if (!$dados) {

        resposta(400, [

            "sucesso" => false,

            "mensagem" =>
                "JSON inválido."
        ]);
    }


    $idCondominio =
        $dados['id_tbl_condominio']
        ?? null;


    $unidade =
        trim(
            $dados['unidade']
            ?? ''
        );


    if (
        empty($idCondominio) ||
        $unidade === ''
    ) {

        resposta(400, [

            "sucesso" => false,

            "mensagem" =>
                "Informe condomínio e unidade."
        ]);
    }


    try {


        // --------------------------------------
        // Busca morador
        // --------------------------------------

        $sql = "

            SELECT *

            FROM tbl_condomino

            WHERE
                id_tbl_condomino = :id

                AND id_tbl_condominio =
                    :condominio

                AND unidade = :unidade

            LIMIT 1

        ";


        $stmt =
            $PDO->prepare($sql);


        $stmt->bindValue(
            ':id',
            $idMorador,
            PDO::PARAM_INT
        );


        $stmt->bindValue(
            ':condominio',
            $idCondominio,
            PDO::PARAM_INT
        );


        $stmt->bindValue(
            ':unidade',
            $unidade
        );


        $stmt->execute();


        $morador =
            $stmt->fetch(
                PDO::FETCH_ASSOC
            );


        if (!$morador) {

            resposta(404, [

                "sucesso" => false,

                "mensagem" =>
                    "Morador não encontrado nessa unidade."
            ]);
        }


        // --------------------------------------
        // Campos editáveis
        // --------------------------------------

        $nome =
            trim(
                $dados['nome']
                ?? $morador['nome']
            );


        $cpf =
            trim(
                $dados['cpf']
                ?? $morador['cpf']
            );


        $dataNascimento =
            $dados['data_nascimento']
            ?? $morador['data_nascimento'];


        // String vazia em coluna DATE quebra o UPDATE em MySQL strict
        // (execute falha silencioso e o 200 sai com valores ecoados).
        // Normaliza para NULL igual ao POST.
        if (
            $dataNascimento === '' ||
            $dataNascimento === null
        ) {

            $dataNascimento = null;
        }


        $email =
            trim(
                $dados['email']
                ?? $morador['email']
            );


        $telefone =
            trim(
                $dados['telefone']
                ?? $morador['telefone']
            );


        $obs =
            trim(
                $dados['obs']
                ?? $morador['obs']
            );


        // --------------------------------------
        // Verifica CPF duplicado
        // --------------------------------------

        $sql = "

            SELECT id_tbl_condomino

            FROM tbl_condomino

            WHERE
                cpf = :cpf

                AND id_tbl_condomino != :id

            LIMIT 1

        ";


        $stmt =
            $PDO->prepare($sql);


        $stmt->bindValue(
            ':cpf',
            $cpf
        );


        $stmt->bindValue(
            ':id',
            $idMorador,
            PDO::PARAM_INT
        );


        $stmt->execute();


        if (
            $stmt->fetch()
        ) {

            resposta(409, [

                "sucesso" => false,

                "mensagem" =>
                    "O CPF informado já pertence a outro morador."
            ]);
        }


        // --------------------------------------
        // Atualiza
        // --------------------------------------

        $sql = "

            UPDATE tbl_condomino

            SET

                nome = :nome,

                cpf = :cpf,

                data_nascimento =
                    :data_nascimento,

                email = :email,

                telefone = :telefone,

                obs = :obs

            WHERE

                id_tbl_condomino = :id

                AND id_tbl_condominio =
                    :condominio

                AND unidade = :unidade

        ";


        $stmt =
            $PDO->prepare($sql);


        $stmt->bindValue(
            ':nome',
            $nome
        );


        $stmt->bindValue(
            ':cpf',
            $cpf
        );


        if ($dataNascimento === null) {

            $stmt->bindValue(
                ':data_nascimento',
                null,
                PDO::PARAM_NULL
            );

        } else {

            $stmt->bindValue(
                ':data_nascimento',
                $dataNascimento
            );
        }


        $stmt->bindValue(
            ':email',
            $email
        );


        $stmt->bindValue(
            ':telefone',
            $telefone
        );


        $stmt->bindValue(
            ':obs',
            $obs
        );


        $stmt->bindValue(
            ':id',
            $idMorador,
            PDO::PARAM_INT
        );


        $stmt->bindValue(
            ':condominio',
            $idCondominio,
            PDO::PARAM_INT
        );


        $stmt->bindValue(
            ':unidade',
            $unidade
        );


        $okUpdate = $stmt->execute();


        if ($okUpdate === false) {

            $info = $stmt->errorInfo();

            throw new Exception(
                "Falha ao atualizar morador: " .
                ($info[2] ?? 'erro no banco')
            );
        }


        // --------------------------------------
        // Foto (opcional, só no multipart)
        // --------------------------------------

        $nomeFoto =
            $morador['foto'] ?? null;


        if (
            $isMultipart &&
            isset($_FILES['foto']) &&
            $_FILES['foto']['error'] === UPLOAD_ERR_OK
        ) {

            $nomeFoto =
                $idMorador . '.jpg';


            $caminhoFoto =
                $pastaFotos . $nomeFoto;


            if (!is_dir($pastaFotos)) {

                mkdir(
                    $pastaFotos,
                    0755,
                    true
                );
            }


            processarFoto(

                $_FILES['foto'],

                $caminhoFoto,

                $limiteFoto,

                $maxLargura,

                $maxAltura
            );


            $sqlFoto = "
                UPDATE tbl_condomino
                SET foto = :foto
                WHERE id_tbl_condomino = :id
            ";


            $stmtFoto =
                $PDO->prepare($sqlFoto);


            $stmtFoto->bindValue(
                ':foto',
                $nomeFoto
            );


            $stmtFoto->bindValue(
                ':id',
                $idMorador,
                PDO::PARAM_INT
            );


            $stmtFoto->execute();
        }


        resposta(200, [

            "sucesso" => true,

            "mensagem" =>
                "Morador atualizado com sucesso.",

            "dados" => [

                "id_tbl_condomino" =>
                    (int)$idMorador,

                "nome" =>
                    $nome,

                "cpf" =>
                    $cpf,

                "email" =>
                    $email,

                "telefone" =>
                    $telefone,

                "unidade" =>
                    $unidade,

                "id_tbl_condominio" =>
                    (int)$idCondominio,

                "foto" =>
                    $nomeFoto
            ]
        ]);


    } catch (Throwable $e) {

        resposta(500, [

            "sucesso" => false,

            "mensagem" =>
                "Erro ao atualizar morador.",

            "erro" =>
                $e->getMessage()
        ]);
    }
}


// ==========================================================
// DELETE - EXCLUSÃO
// ==========================================================

if ($metodo === 'DELETE') {


    $idMorador =
        $_GET['id_tbl_condomino'] ?? null;


    $idCondominio =
        $_GET['id_tbl_condominio'] ?? null;


    $unidade =
        trim(
            $_GET['unidade'] ?? ''
        );


    if (
        empty($idMorador) ||
        empty($idCondominio) ||
        $unidade === ''
    ) {

        resposta(400, [

            "sucesso" => false,

            "mensagem" =>
                "Informe morador, condomínio e unidade."
        ]);
    }


    try {


        // --------------------------------------
        // Busca morador
        // --------------------------------------

        $sql = "

            SELECT

                id_tbl_condomino,

                nome,

                foto

            FROM tbl_condomino

            WHERE

                id_tbl_condomino = :id

                AND id_tbl_condominio =
                    :condominio

                AND unidade = :unidade

            LIMIT 1

        ";


        $stmt =
            $PDO->prepare($sql);


        $stmt->bindValue(
            ':id',
            $idMorador,
            PDO::PARAM_INT
        );


        $stmt->bindValue(
            ':condominio',
            $idCondominio,
            PDO::PARAM_INT
        );


        $stmt->bindValue(
            ':unidade',
            $unidade
        );


        $stmt->execute();


        $morador =
            $stmt->fetch(
                PDO::FETCH_ASSOC
            );


        if (!$morador) {

            resposta(404, [

                "sucesso" => false,

                "mensagem" =>
                    "Morador não encontrado nessa unidade."
            ]);
        }


        // --------------------------------------
        // Transação
        // --------------------------------------

        $PDO->beginTransaction();


        // --------------------------------------
        // Exclui banco
        // --------------------------------------

        $sql = "

            DELETE FROM tbl_condomino

            WHERE

                id_tbl_condomino = :id

                AND id_tbl_condominio =
                    :condominio

                AND unidade = :unidade

        ";


        $stmt =
            $PDO->prepare($sql);


        $stmt->bindValue(
            ':id',
            $idMorador,
            PDO::PARAM_INT
        );


        $stmt->bindValue(
            ':condominio',
            $idCondominio,
            PDO::PARAM_INT
        );


        $stmt->bindValue(
            ':unidade',
            $unidade
        );


        $stmt->execute();


        // --------------------------------------
        // Remove foto
        // --------------------------------------

        if (
            !empty($morador['foto'])
        ) {

            $caminhoFoto =
                $pastaFotos .
                basename(
                    $morador['foto']
                );


            if (
                file_exists(
                    $caminhoFoto
                )
            ) {

                @unlink(
                    $caminhoFoto
                );
            }
        }


        // --------------------------------------
        // Commit
        // --------------------------------------

        $PDO->commit();


        resposta(200, [

            "sucesso" => true,

            "mensagem" =>
                "Morador excluído com sucesso.",

            "dados" => [

                "id_tbl_condomino" =>
                    (int)$idMorador,

                "nome" =>
                    $morador['nome'],

                "foto_excluida" =>
                    $morador['foto']
            ]
        ]);


    } catch (Throwable $e) {


        if (
            $PDO->inTransaction()
        ) {

            $PDO->rollBack();
        }


        resposta(500, [

            "sucesso" => false,

            "mensagem" =>
                "Erro ao excluir morador.",

            "erro" =>
                $e->getMessage()
        ]);
    }
}


// ==========================================================
// MÉTODO NÃO EXISTENTE
// ==========================================================

resposta(405, [

    "sucesso" => false,

    "mensagem" =>
        "Método não permitido."
]);
