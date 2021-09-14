<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateTopicNodesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('topic_nodes', function (Blueprint $table) {
            $table->id();
			$table->integer('parent_id');
			$table->enum('condition', ['success', 'fail','none'])->default('none');
			$table->foreignId('topic_id') ->constrained()      ->onUpdate('cascade')      ->onDelete('cascade');
			$table->foreignId('lesson_id') ->constrained()      ->onUpdate('cascade')      ->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('topic_nodes');
    }
}
